/* eslint-disable @typescript-eslint/require-await */
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import {
  ILLMProvider,
  LLMGenerateOptions,
  LLMGenerateResult,
} from '../interfaces/llm.interface';

/**
 * Groq LLM Provider Implementation
 * Handles all Groq-specific API interactions
 */
@Injectable()
export class GroqProvider implements ILLMProvider {
  private readonly logger = new Logger(GroqProvider.name);
  private groqClient: Groq;
  private readonly defaultModel: string;
  private readonly maxConcurrentCalls: number;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('groq.apiKey');
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    this.groqClient = new Groq({ apiKey });
    this.defaultModel = this.configService.get<string>(
      'groq.defaultModel',
      'mixtral-8x7b-32768',
    );
    this.maxConcurrentCalls = this.configService.get<number>(
      'groq.maxConcurrentCalls',
      5,
    );

    this.logger.log(
      `Groq Provider initialized with model: ${this.defaultModel}`,
    );
  }

  async generate(options: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const startTime = Date.now();

    try {
      const model = options.model || this.defaultModel;

      this.logger.debug(
        `Generating response with params: temp=${options.temperature}, topP=${options.topP}, maxTokens=${options.maxTokens}`,
      );

      const chatCompletion = await this.groqClient.chat.completions.create({
        messages: [{ role: 'user', content: options.prompt }],
        model,
        temperature: options.temperature,
        top_p: options.topP,
        max_tokens: options.maxTokens || 1024,
      });

      const latencyMs = Date.now() - startTime;
      const text = chatCompletion.choices[0]?.message?.content || '';
      const tokensUsed = chatCompletion.usage?.total_tokens || 0;

      this.logger.debug(
        `Generated response in ${latencyMs}ms, tokens: ${tokensUsed}`,
      );

      return { text, tokensUsed, latencyMs };
    } catch (error) {
      this.logger.error('Error generating LLM response:', error);
      throw error;
    }
  }

  async generateBatch(
    options: LLMGenerateOptions[],
  ): Promise<LLMGenerateResult[]> {
    if (options.length > this.maxConcurrentCalls) {
      throw new BadRequestException('Max concurrent calls exceeded');
    }

    this.logger.log(`Generating batch of ${options.length} responses`);

    const results = await Promise.allSettled(
      options.map((opt) => this.generate(opt)),
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        this.logger.error(
          `Failed to generate response ${index}:`,
          result.reason,
        );
        throw result.reason;
      }
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.generate({
        prompt: 'Hello',
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 10,
      });
      return true;
    } catch (error) {
      this.logger.error('LLM connection test failed:', error);
      return false;
    }
  }
}
