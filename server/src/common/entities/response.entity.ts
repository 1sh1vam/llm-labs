import { Timestamp } from 'firebase-admin/firestore';

export interface LLMParameters {
  temperature: number;
  topP: number;
  model: string;
}

export interface MetricDetails {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  avgWordLength: number;
  uniqueWordRatio: number;
  punctuationRatio: number;
  paragraphCount: number;
  repeatedPhrases: number;
  hasProperEnding: boolean;
  maxRepeatedPhraseLength: number;

  // Relevancy details
  promptKeywords: string[];
  responseKeywords: string[];
  sharedKeywords: string[];
  keywordOverlapRatio: number;
}

export interface QualityMetrics {
  // Top 5 metric scores (0-1)
  coherenceScore: number; // Sentence quality and structure
  relevancyScore: number; // Addresses the prompt
  completenessScore: number; // Not truncated
  repetitionScore: number; // No loops or stuck responses
  lengthScore: number; // Appropriate length

  // Composite score
  overallScore: number;

  // Raw metric details for transparency
  details: MetricDetails;
}

export interface Response {
  id?: string;
  experimentId: string;

  // LLM Parameters used
  parameters: LLMParameters;

  // LLM Response
  responseText: string;
  tokensUsed: number;
  generatedAt: Timestamp;
  latencyMs: number;

  // Quality Metrics
  metrics: Omit<QualityMetrics, 'details'> & {
    details: Omit<
      MetricDetails,
      'promptKeywords' | 'responseKeywords' | 'sharedKeywords'
    >;
  };

  // Error tracking
  error?: string;
  status: 'success' | 'failed';
}
