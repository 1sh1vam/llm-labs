import { Experiment } from '../../common/entities/experiment.entity';
import { Response } from '../../common/entities/response.entity';

export class ExperimentResponseDto {
  experiment: Experiment;
  responses?: Response[];
  bestResponse?: Response;
}

export class ExperimentListItemDto {
  id: string;
  prompt: string;
  createdAt: Date;
  status: string;
  totalResponses: number;
  averageScore: number;
  bestResponse?: {
    responseText: string;
    overallScore: number;
    parameters: any;
  };
}

export class ExperimentListResponseDto {
  experiments: ExperimentListItemDto[];
  hasMore: boolean;
  nextCursor: string | null;
}

export class MetricBreakdown {
  byTemperature: Record<number, number>;
  byTopP: Record<number, number>;
}

export class ExperimentMetricsDto {
  experimentId: string;
  prompt: string;
  summary: {
    totalResponses: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
    scoreDistribution: number[];
  };
  metricBreakdown: MetricBreakdown;
  responses: Array<{
    id: string;
    parameters: any;
    metrics: any;
    responsePreview: string;
  }>;
}
