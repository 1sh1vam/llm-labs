/**
 * Interface for LLM providers
 * Allows for easy swapping of LLM providers (Groq, OpenAI, Anthropic, etc.)
 */

export interface LLMGenerateOptions {
  prompt: string;
  temperature: number;
  topP: number;
  model?: string;
  maxTokens?: number;
}

export interface LLMGenerateResult {
  text: string;
  tokensUsed: number;
  latencyMs: number;
}

export interface ILLMProvider {
  generate(options: LLMGenerateOptions): Promise<LLMGenerateResult>;
  generateBatch(options: LLMGenerateOptions[]): Promise<LLMGenerateResult[]>;
  testConnection(): Promise<boolean>;
}
