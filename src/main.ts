import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { getBotToken } from 'nestjs-telegraf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  
  const token = configService.get<string>('TELEGRAM_BOT_TOKEN');
  const domain = configService.get<string>('WEBHOOK_DOMAIN');

  if (domain && domain !== 'localhost') {
    const bot = app.get(getBotToken());
    const webhookPath = `/telegraf/${token}`;
    app.use(bot.webhookCallback(webhookPath));
    
    // Опционально: можно явно вызвать setWebhook здесь, 
    // но обычно Telegraf делает это сам, если настроен.
    // Однако, так как мы убрали webhook из launchOptions, лучше вызвать его явно.
    await bot.telegram.setWebhook(`https://${domain}${webhookPath}`);
    console.log(`Webhook set to: https://${domain}${webhookPath}`);
  }

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
