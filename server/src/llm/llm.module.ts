import { Module } from '@nestjs/common';
import { GroqProvider } from './providers/groq.provider';
import { LLMFacade } from './llm.facade';

@Module({
  providers: [
    GroqProvider, // Groq provider implementation
    LLMFacade, // Facade for unified LLM interface
  ],
  exports: [
    LLMFacade, // Export facade for consumers
  ],
})
export class LLMModule {}
