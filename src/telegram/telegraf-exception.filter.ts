import { Catch, ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Context } from 'telegraf';

@Catch()
export class TelegrafExceptionFilter implements ExceptionFilter {
  async catch(exception: any, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToRpc().getContext<Context>();
    
    console.error('Unhandled Telegraf exception:', exception);

    // Если это вебхук, Telegram ожидает 200 OK, чтобы не повторять запрос.
    // nestjs-telegraf по умолчанию обрабатывает это, но мы можем явно отправить ответ,
    // если хотим гарантировать отсутствие повторов при критических ошибках.
    
    try {
      if (ctx && typeof ctx.reply === 'function') {
        await ctx.reply('Произошла ошибка при обработке сообщения. Попробуйте позже.');
      }
    } catch (e) {
      console.error('Failed to send error message to user:', e);
    }
    
    // Мы не пробрасываем ошибку дальше (не делаем throw), 
    // чтобы nestjs-telegraf мог завершить обработку запроса успешно (200 OK)
  }
}
