export interface ParameterRanges {
  temperatures: number[];
  topP: number[];
}

export interface ScoreDistribution {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev?: number;
}

export enum ExperimentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ResponseParameters {
  temperature: number;
  topP: number;
  maxTokens: number;
  model: string;
}

export interface ResponseMetrics {
  lengthScore: number;
  coherenceScore: number;
  completenessScore: number;
  repetitionScore: number;
  relevancyScore: number;
  overallScore: number;
  details?: {
    wordCount: number;
    sentenceCount: number;
    avgSentenceLength: number;
    uniqueWordRatio: number;
    paragraphCount: number;
  };
}

export interface Response {
  id: string;
  experimentId: string;
  parameters: ResponseParameters;
  responseText: string;
  tokensUsed: number;
  generatedAt: string;
  latencyMs: number;
  metrics: ResponseMetrics;
  status: 'success' | 'failed';
}

export interface BestResponse {
  responseText: string;
  overallScore: number;
  parameters: {
    temperature: number;
    topP: number;
    maxTokens: number;
  };
}

export interface Experiment {
  id: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
  status: ExperimentStatus;
  parameterRanges: ParameterRanges;
  model: string;
  totalResponses: number;
  completedResponses: number;
  failedResponses: number;
  bestResponseId?: string;
  bestScore?: number;
  averageScore?: number;
  scoreDistribution?: ScoreDistribution;
  error?: string;
  bestResponse?: BestResponse;
}

export interface ExperimentDetail {
  experiment: Experiment;
  responses: Response[];
  bestResponse?: Response;
}

export interface ExperimentsListResponse {
  experiments: Experiment[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CreateExperimentRequest {
  prompt: string;
  parameterRanges: ParameterRanges;
  model?: string;
  userId?: string;
}

export interface CreateExperimentResponse {
  experimentId: string;
  status: string;
  message: string;
}

export interface MetricBreakdown {
  byTemperature: Record<number, number>;
  byTopP: Record<number, number>;
}

export interface ExperimentMetricsDto {
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
    parameters: ResponseParameters;
    metrics: ResponseMetrics;
    responsePreview: string;
  }>;
}

