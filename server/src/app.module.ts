import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { LLMModule } from './llm/llm.module';
import { MetricsModule } from './metrics/metrics.module';
import { ExperimentsModule } from './experiments/experiments.module';
import { HealthModule } from './health/health.module';
import configuration from './config/configuration';
import { validate } from './config/validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    DatabaseModule,
    LLMModule,
    MetricsModule,
    ExperimentsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
