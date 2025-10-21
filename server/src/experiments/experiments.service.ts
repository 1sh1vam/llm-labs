import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirestoreService } from '../database/firestore.service';
import { LLMFacade } from '../llm/llm.facade';
import { MetricsService } from '../metrics/metrics.service';
import { ExperimentsRepository } from './repositories/experiments.repository';
import { ResponsesRepository } from './repositories/responses.repository';
import { CreateExperimentDto } from './dto/create-experiment.dto';
import {
  Experiment,
  ExperimentStatus,
  ParameterRanges,
} from '../common/entities/experiment.entity';
import { Response, LLMParameters } from '../common/entities/response.entity';
import {
  ExperimentMetricsDto,
  MetricBreakdown,
} from './dto/experiment-response.dto';
import { ProgressEvent, ProgressCallback } from './types/progress.types';

@Injectable()
export class ExperimentsService {
  private readonly logger = new Logger(ExperimentsService.name);
  private readonly maxCombinations: number;

  constructor(
    private readonly experimentsRepo: ExperimentsRepository,
    private readonly responsesRepo: ResponsesRepository,
    private readonly llmFacade: LLMFacade,
    private readonly metricsService: MetricsService,
    private readonly configService: ConfigService,
    private readonly firestoreService: FirestoreService,
  ) {
    this.maxCombinations = this.configService.get<number>(
      'experiments.maxCombinations',
      20,
    );
  }

  async createExperiment(
    dto: CreateExperimentDto,
    onProgress?: ProgressCallback,
  ) {
    try {
      // Generate parameter combinations
      const combinations = this.generateParameterCombinations(
        dto.parameterRanges,
      );

      // Validate combination count
      if (combinations.length > this.maxCombinations) {
        throw new BadRequestException(
          `Too many parameter combinations (${combinations.length}). Maximum allowed is ${this.maxCombinations}`,
        );
      }

      // Create experiment document
      const experiment: Experiment = {
        prompt: dto.prompt,
        createdAt: this.firestoreService.timestamp() as any,
        updatedAt: this.firestoreService.timestamp() as any,
        status: ExperimentStatus.PENDING,
        parameterRanges: { ...dto.parameterRanges },
        model:
          dto.model ||
          this.configService.get<string>(
            'groq.defaultModel',
            'mixtral-8x7b-32768',
          ),
        totalResponses: combinations.length,
        completedResponses: 0,
        failedResponses: 0,
      };

      const experimentId = await this.experimentsRepo.create(experiment);

      this.logger.log(
        `Created experiment ${experimentId} with ${combinations.length} combinations`,
      );

      // Emit: Started
      onProgress?.({
        type: 'started',
        message: `Experiment created with ${combinations.length} parameter combinations`,
        progress: {
          current: 1,
          total: 4,
          percentage: Math.round((1 / 4) * 100),
        },
        data: { experimentId, totalCombinations: combinations.length },
      });

      // Process experiment
      await this.processExperiment(
        experimentId,
        dto.prompt,
        combinations,
        onProgress,
      );

      return { experimentId, status: 'completed' };
    } catch (error) {
      this.logger.error(`Failed to create experiment:`, error);

      onProgress?.({
        type: 'error',
        message: `Error: ${(error as Error).message}`,
        progress: { current: 0, total: 0, percentage: 0 },
      });

      if (
        error instanceof HttpException &&
        error.getStatus() > 399 &&
        error.getStatus() < 500
      )
        throw error;

      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  private async processExperiment(
    experimentId: string,
    prompt: string,
    combinations: LLMParameters[],
    onProgress?: ProgressCallback,
  ): Promise<void> {
    try {
      // Update status to processing
      await this.experimentsRepo.updateStatus(
        experimentId,
        ExperimentStatus.PROCESSING,
      );

      // Emit: Processing
      onProgress?.({
        type: 'processing',
        message: `Processing ${combinations.length} parameter combinations...`,
        progress: {
          current: 2,
          total: 4,
          percentage: Math.round((2 / 4) * 100),
        },
      });

      // Process all combinations in parallel
      const results = await Promise.allSettled(
        combinations.map((params) =>
          this.generateAndEvaluateResponse(experimentId, prompt, params),
        ),
      );

      // Count successes and failures
      const successCount = results.filter(
        (r) => r.status === 'fulfilled',
      ).length;
      const failureCount = results.filter(
        (r) => r.status === 'rejected',
      ).length;

      // Emit: Responses completed
      onProgress?.({
        type: 'responses_generated',
        message: `Generated ${successCount} responses (${failureCount} failed)`,
        progress: {
          current: 3,
          total: 4,
          percentage: Math.round((3 / 4) * 100),
        },
        data: { completed: successCount, failed: failureCount },
      });

      // Get all responses to find the best one
      const responses =
        await this.responsesRepo.findByExperimentId(experimentId);

      let bestResponse: Response | null = null;
      let bestScore: number = -1;
      let totalScore = 0;
      const scores: number[] = [];

      for (const response of responses) {
        if (response.status === 'success') {
          const score = response.metrics.overallScore;
          totalScore += score;
          scores.push(score);

          if (score > bestScore) {
            bestScore = score;
            bestResponse = response;
          }
        }
      }

      // Calculate statistics
      const averageScore = successCount > 0 ? totalScore / successCount : 0;
      scores.sort((a, b) => a - b);
      const median =
        scores.length > 0 ? scores[Math.floor(scores.length / 2)] : 0;

      // Update experiment with results
      await this.experimentsRepo.updateWithResults(experimentId, {
        completedResponses: successCount,
        failedResponses: failureCount,
        bestResponseId: bestResponse?.id,
        bestScore: bestScore > 0 ? bestScore : undefined,
        averageScore,
        scoreDistribution: {
          min: scores[0] || 0,
          max: scores[scores.length - 1] || 0,
          mean: averageScore,
          median,
          stdDev: this.calculateStdDev(scores, averageScore),
        },
      });

      // Emit: Complete
      onProgress?.({
        type: 'complete',
        message: `Experiment complete! ${successCount} responses, ${failureCount} failed. Best score: ${bestScore > 0 ? bestScore.toFixed(3) : 'N/A'}`,
        progress: {
          current: 4,
          total: 4,
          percentage: Math.round((4 / 4) * 100),
        },
        data: {
          experimentId,
          completedResponses: successCount,
          failedResponses: failureCount,
          bestScore,
          averageScore,
          bestResponse,
        },
      });

      this.logger.log(
        `Completed experiment ${experimentId}: ${successCount} successes, ${failureCount} failures`,
      );
    } catch (error) {
      this.logger.error(`Failed to process experiment ${experimentId}:`, error);

      await this.experimentsRepo.updateStatus(
        experimentId,
        ExperimentStatus.FAILED,
        (error as Error).message,
      );

      onProgress?.({
        type: 'error',
        message: `Processing failed: ${(error as Error).message}`,
        progress: { current: 0, total: 0, percentage: 0 },
      });

      throw error;
    }
  }

  private async generateAndEvaluateResponse(
    experimentId: string,
    prompt: string,
    parameters: LLMParameters,
  ): Promise<void> {
    try {
      // Generate LLM response via facade
      const result = await this.llmFacade.generate({
        prompt,
        temperature: parameters.temperature,
        topP: parameters.topP,
        model: parameters.model,
      });

      // Calculate metrics
      const metrics = this.metricsService.calculateMetrics(prompt, result.text);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { promptKeywords, responseKeywords, sharedKeywords, ...details } =
        metrics.details;
      // Store response via repository
      const response: Response = {
        experimentId,
        parameters,
        responseText: result.text,
        tokensUsed: result.tokensUsed,
        generatedAt: this.firestoreService.timestamp() as any,
        latencyMs: result.latencyMs,
        metrics: {
          ...metrics,
          details,
        },
        status: 'success',
      };

      await this.responsesRepo.create(experimentId, response);
    } catch (error) {
      this.logger.error('Error generating response:', error);

      // Store failed response via repository
      const response: Response = {
        experimentId,
        parameters,
        responseText: '',
        tokensUsed: 0,
        generatedAt: this.firestoreService.timestamp() as any,
        latencyMs: 0,
        metrics: null as any,
        status: 'failed',
        error: (error as Error).message,
      };

      await this.responsesRepo.create(experimentId, response);

      throw error;
    }
  }

  async getExperiment(id: string) {
    try {
      const experiment = await this.experimentsRepo.findById(id);

      if (!experiment) {
        throw new NotFoundException(`Experiment ${id} not found`);
      }

      const responses = await this.responsesRepo.findByExperimentId(id);

      const bestResponse = experiment.bestResponseId
        ? responses.find((r) => r.id === experiment.bestResponseId)
        : null;

      return {
        experiment,
        responses,
        bestResponse,
      };
    } catch (error) {
      this.logger.error(`Failed to get experiment ${id}:`, error);
      if (
        error instanceof HttpException &&
        error.getStatus() > 399 &&
        error.getStatus() < 500
      )
        throw error;

      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  async getAllExperiments(limit: number = 20, cursor?: string): Promise<any> {
    try {
      const experiments = await this.experimentsRepo.findAll(limit + 1, cursor);

      const hasMore = experiments.length > limit;
      const items = experiments.slice(0, limit);

      const experimentList = await Promise.all(
        items.map(async (exp) => {
          let bestResponse: Response | undefined = undefined;
          if (exp.bestResponseId) {
            const responses = await this.responsesRepo.findByExperimentId(
              exp.id!,
            );
            bestResponse = responses.find((r) => r.id === exp.bestResponseId);
          }

          return {
            id: exp.id,
            prompt: exp.prompt,
            createdAt: exp.createdAt,
            status: exp.status,
            totalResponses: exp.totalResponses,
            averageScore: exp.averageScore || 0,
            bestResponse: bestResponse
              ? {
                  responseText:
                    bestResponse.responseText.substring(0, 200) +
                    (bestResponse.responseText.length > 200 ? '...' : ''),
                  overallScore: bestResponse.metrics?.overallScore || 0,
                  parameters: bestResponse.parameters,
                }
              : null,
          };
        }),
      );

      return {
        experiments: experimentList,
        hasMore,
        nextCursor: hasMore ? items[items.length - 1].id : null,
      };
    } catch (error) {
      this.logger.error(`Failed to get all experiments:`, error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  async getExperimentMetrics(id: string): Promise<ExperimentMetricsDto> {
    try {
      const experiment = await this.experimentsRepo.findById(id);

      if (!experiment) {
        throw new NotFoundException(`Experiment ${id} not found`);
      }

      const responses = await this.responsesRepo.findByExperimentId(id);

      const successfulResponses = responses.filter(
        (r) => r.status === 'success',
      );

      // Calculate summary statistics
      const scores = successfulResponses.map((r) => r.metrics.overallScore);
      const scoreDistribution = this.createHistogram(scores, 10);

      // Calculate metric breakdown by parameter
      const metricBreakdown =
        this.calculateMetricBreakdown(successfulResponses);

      // Prepare response previews
      const responsePreviews = successfulResponses.map((r) => ({
        id: r.id!,
        parameters: r.parameters,
        metrics: r.metrics,
        responsePreview: r.responseText.substring(0, 100) + '...',
      }));

      return {
        experimentId: id,
        prompt: experiment.prompt,
        summary: {
          totalResponses: successfulResponses.length,
          averageScore: experiment.averageScore || 0,
          bestScore: experiment.bestScore || 0,
          worstScore: Math.min(...scores),
          scoreDistribution,
        },
        metricBreakdown,
        responses: responsePreviews,
      };
    } catch (error) {
      this.logger.error(`Failed to get experiment metrics ${id}:`, error);
      if (
        error instanceof HttpException &&
        error.getStatus() > 399 &&
        error.getStatus() < 500
      )
        throw error;

      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  async deleteExperiment(id: string) {
    try {
      const experiment = await this.experimentsRepo.findById(id);

      if (!experiment) {
        throw new NotFoundException(`Experiment ${id} not found`);
      }

      // Delete all responses first via repository
      await this.responsesRepo.deleteByExperimentId(id);

      // Delete experiment via repository
      await this.experimentsRepo.delete(id);

      this.logger.log(`Deleted experiment ${id}`);
      return { message: `Experiment ${id} deleted successfully` };
    } catch (error) {
      this.logger.error(`Failed to delete experiment ${id}:`, error);
      if (
        error instanceof HttpException &&
        error.getStatus() > 399 &&
        error.getStatus() < 500
      )
        throw error;

      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  async exportExperiment(id: string, format: 'json' | 'csv') {
    try {
      const data = await this.getExperiment(id);

      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      }

      // Convert to CSV format
      return this.convertToCSV({ responses: data.responses });
    } catch (error) {
      this.logger.error(`Failed to export experiment ${id}:`, error);

      if (
        error instanceof HttpException &&
        error.getStatus() > 399 &&
        error.getStatus() < 500
      )
        throw error;

      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  // Helper methods

  private generateParameterCombinations(
    ranges: ParameterRanges,
  ): LLMParameters[] {
    const combinations: LLMParameters[] = [];
    const model = this.configService.get<string>(
      'groq.defaultModel',
      'mixtral-8x7b-32768',
    );

    for (const temperature of ranges.temperatures) {
      for (const topP of ranges.topP) {
        combinations.push({
          temperature,
          topP,
          model,
        });
      }
    }

    return combinations;
  }

  private calculateStdDev(scores: number[], mean: number): number {
    if (scores.length === 0) return 0;
    const variance =
      scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
      scores.length;
    return Math.sqrt(variance);
  }

  private createHistogram(scores: number[], bins: number): number[] {
    const histogram = new Array(bins).fill(0);
    scores.forEach((score) => {
      const binIndex = Math.min(Math.floor(score * bins), bins - 1);
      histogram[binIndex]++;
    });
    return histogram;
  }

  private calculateMetricBreakdown(responses: Response[]): MetricBreakdown {
    const byTemperature: Record<number, number[]> = {};
    const byTopP: Record<number, number[]> = {};

    responses.forEach((r: Response) => {
      const score = r.metrics.overallScore;
      const { temperature, topP } = r.parameters;

      if (!byTemperature[temperature]) byTemperature[temperature] = [];
      byTemperature[temperature].push(score);

      if (!byTopP[topP]) byTopP[topP] = [];
      byTopP[topP].push(score);
    });

    const average = (arr: number[]) =>
      arr.reduce((a, b) => a + b, 0) / arr.length;

    return {
      byTemperature: Object.fromEntries(
        Object.entries(byTemperature).map(([k, v]) => [k, average(v)]),
      ),
      byTopP: Object.fromEntries(
        Object.entries(byTopP).map(([k, v]) => [k, average(v)]),
      ),
    };
  }

  private convertToCSV(data: { responses: Response[] }): string {
    const rows: string[] = [];

    // Header - Top 5 metrics only
    rows.push(
      'Response ID,Temperature,Top-P,Overall Score,Coherence Score,Relevancy Score,Completeness Score,Repetition Score,Length Score,Word Count,Latency (ms)',
    );

    // Data rows
    data.responses.forEach((response: Response) => {
      const m = response.metrics;
      const p = response.parameters;
      rows.push(
        [
          response.id,
          p.temperature,
          p.topP,
          m.overallScore,
          m.coherenceScore,
          m.relevancyScore,
          m.completenessScore,
          m.repetitionScore,
          m.lengthScore,
          m.details.wordCount,
          response.latencyMs,
        ].join(','),
      );
    });

    return rows.join('\n');
  }
}
