import { Controller, Get } from '@nestjs/common';
import { LLMFacade } from '../llm/llm.facade';

@Controller('api/health')
export class HealthController {
  constructor(private readonly llmFacade: LLMFacade) {}

  @Get()
  async checkHealth() {
    const llmStatus = await this.llmFacade
      .testConnection()
      .then(() => 'connected')
      .catch(() => 'error');

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      llmProvider: llmStatus,
    };
  }
}
