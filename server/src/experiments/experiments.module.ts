import { Module } from '@nestjs/common';
import { ExperimentsController } from './experiments.controller';
import { ExperimentsService } from './experiments.service';
import { ExperimentsRepository } from './repositories/experiments.repository';
import { ResponsesRepository } from './repositories/responses.repository';
import { LLMModule } from '../llm/llm.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [LLMModule, MetricsModule],
  controllers: [ExperimentsController],
  providers: [
    ExperimentsService, // Single service with optional streaming callback
    ExperimentsRepository, // Repository for experiments data access
    ResponsesRepository, // Repository for responses data access
  ],
  exports: [ExperimentsService],
})
export class ExperimentsModule {}
