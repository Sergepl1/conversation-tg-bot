import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const modelName = this.configService.get<string>('GEMINI_MODEL');
    const apiVersion = this.configService.get<string>('GEMINI_API_VERSION') || 'v1';

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel(
      { model: modelName },
      { apiVersion },
    );
  }

  async generateResponse(text: string, customName?: string): Promise<string> {
    const basePrompt = this.configService.get<string>('GEMINI_PROMPT');
    const nameInstruction = customName ? `от имени ${customName}` : '';
    
    const messagesCount = this.configService.get<string>('MESSAGES_COUNT') || '1';
    
    const prompt = `${basePrompt} ${nameInstruction} на основании этого сообщения: "${text}". 
Необходимо сгенерировать ровно ${messagesCount} варианта(ов) сообщений.
Разделяй каждое сообщение строкой "---END_MESSAGE---". Не нумеруй варианты.
Не используй Markdown или другое форматирование (жирный, курсив и т.д.). Ответ должен быть в виде обычного текста.`;
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API Error:', error);
      return 'Извини, что-то пошло не так при генерации ответа.';
    }
  }
}
