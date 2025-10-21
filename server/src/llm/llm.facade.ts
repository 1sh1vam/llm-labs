import { Injectable } from '@nestjs/common';
import { GroqProvider } from './providers/groq.provider';
import {
  LLMGenerateOptions,
  LLMGenerateResult,
} from './interfaces/llm.interface';

/**
 * Facade Pattern for LLM Services
 * Provides a unified interface for LLM operations
 * Allows easy switching between providers (Groq, OpenAI, Anthropic, etc.)
 */
@Injectable()
export class LLMFacade {
  constructor(
    private readonly groqProvider: GroqProvider,
    // Add more providers here in the future:
    // private readonly openaiProvider: OpenAIProvider,
    // private readonly anthropicProvider: AnthropicProvider,
  ) {}

  /**
   * Generate a single LLM response
   * Currently uses Groq, but can be configured to use different providers
   */
  async generate(options: LLMGenerateOptions): Promise<LLMGenerateResult> {
    // In the future, you could add provider selection logic here
    return this.groqProvider.generate(options);
  }

  /**
   * Generate multiple LLM responses in batch
   */
  async generateBatch(
    options: LLMGenerateOptions[],
  ): Promise<LLMGenerateResult[]> {
    return this.groqProvider.generateBatch(options);
  }

  /**
   * Test connection to LLM provider
   */
  async testConnection(): Promise<boolean> {
    return this.groqProvider.testConnection();
  }
}
