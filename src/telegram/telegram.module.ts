import { Module } from '@nestjs/common';
import { TelegramUpdate } from './telegram.update';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
  imports: [GeminiModule],
  providers: [TelegramUpdate],
})
export class TelegramModule {}
