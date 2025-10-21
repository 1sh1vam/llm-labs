import { Timestamp } from 'firebase-admin/firestore';

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

export interface Experiment {
  id?: string;
  prompt: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: ExperimentStatus;

  // Parameter configurations
  parameterRanges: ParameterRanges;
  model: string;

  // Aggregated results
  totalResponses: number;
  completedResponses: number;
  failedResponses: number;
  bestResponseId?: string;
  bestScore?: number;

  // Statistics
  averageScore?: number;
  scoreDistribution?: ScoreDistribution;

  // Error tracking
  error?: string;
}
