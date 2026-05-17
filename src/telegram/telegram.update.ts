import { Update, On, Message, Ctx, Start, InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { GeminiService } from '../gemini/gemini.service';
import { OnModuleInit, Logger } from '@nestjs/common';

@Update()
export class TelegramUpdate implements OnModuleInit {
  private readonly logger = new Logger(TelegramUpdate.name);
  private messageBuffers: Map<number, { text: string; authorName?: string }[]> = new Map();
  private timers: Map<number, NodeJS.Timeout> = new Map();
  private userNames: Map<number, string> = new Map();

  constructor(
    private readonly geminiService: GeminiService,
    @InjectBot() private readonly bot: Telegraf<Context>,
  ) {}

  async onModuleInit() {
    await this.bot.telegram.setMyCommands([
      { command: 'start', description: 'Запустить бота и обновить имя' },
    ]);
  }

  @Start()
  async onStart(@Ctx() ctx: Context) {
    const from = ctx.from;
    const firstName = from?.first_name || '';
    const lastName = from?.last_name || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown User';
    const username = from?.username ? `@${from.username}` : 'no username';

    this.logger.log(`User started bot: ${fullName} (${username}), ID: ${from?.id}`);

    await ctx.reply(
      `Привет! Я помогу тебе отвечать на сообщения от твоего имени (${fullName}).`,
    );
    
    const chatId = ctx.chat?.id;
    if (chatId) {
      this.userNames.set(chatId, fullName);
    }
  }


  @On('text')
  async onText(@Ctx() ctx: Context, @Message('text') text: string) {
    const from = ctx.from;
    const senderFirstName = from?.first_name || '';
    const senderLastName = from?.last_name || '';
    const senderFullName = [senderFirstName, senderLastName].filter(Boolean).join(' ') || 'Unknown User';
    const senderUsername = from?.username ? `@${from.username}` : 'no username';
    
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    // Извлекаем информацию об авторе пересланного сообщения
    const message = ctx.message as any;
    let authorName: string | undefined;

    if (message?.forward_origin) {
      const origin = message.forward_origin;
      if (origin.type === 'user' && origin.sender_user) {
        const oUser = origin.sender_user;
        authorName = [oUser.first_name, oUser.last_name].filter(Boolean).join(' ');
      } else if (origin.type === 'hidden_user') {
        authorName = origin.sender_user_name;
      } else if (origin.type === 'channel') {
        authorName = origin.chat.title;
      } else if (origin.type === 'chat') {
        authorName = origin.sender_chat.title;
      }
    } else if (message?.forward_from) {
      const fFrom = message.forward_from;
      authorName = [fFrom.first_name, fFrom.last_name].filter(Boolean).join(' ');
    } else if (message?.forward_sender_name) {
      authorName = message.forward_sender_name;
    }

    if (authorName) {
      this.logger.log(`[${chatId}] Forwarded message from ${authorName} (sent by ${senderFullName} ${senderUsername}): ${text}`);
    } else {
      this.logger.log(`[${chatId}] Message from ${senderFullName} ${senderUsername}: ${text}`);
    }

    // Инициализируем буфер для чата, если его нет
    if (!this.messageBuffers.has(chatId)) {
      this.messageBuffers.set(chatId, []);
    }
    
    // Добавляем сообщение в буфер
    this.messageBuffers.get(chatId).push({ text, authorName });

    // Сбрасываем предыдущий таймер, если он был
    if (this.timers.has(chatId)) {
      clearTimeout(this.timers.get(chatId));
    }

    // Устанавливаем новый таймер на 500 мс (достаточно для пачки сообщений)
    const timeout = setTimeout(async () => {
      await this.processBuffer(ctx, chatId);
    }, 500);

    this.timers.set(chatId, timeout);
  }

  private async processBuffer(ctx: Context, chatId: number) {
    const messages = this.messageBuffers.get(chatId);
    if (!messages || messages.length === 0) return;

    // Очищаем данные для этого чата
    this.messageBuffers.delete(chatId);
    this.timers.delete(chatId);

    // Объединяем сообщения
    const combinedText = messages.map(m => m.text).join('\n---\n');

    // Показываем статус "печатает"
    try {
      await ctx.sendChatAction('typing');
    } catch (e) {
      console.error('Error sending chat action:', e);
    }

    const userName = this.userNames.get(chatId);
    const response = await this.geminiService.generateResponse(combinedText, userName);
    
    // Разделяем ответ на отдельные сообщения по маркеру
    const individualMessages = response
      .split('---END_MESSAGE---')
      .map((msg) => msg.trim())
      .filter((msg) => msg.length > 0);

    for (const message of individualMessages) {
      await ctx.reply(message);
    }
  }
}
