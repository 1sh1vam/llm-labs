import { Injectable, Logger } from '@nestjs/common';
import {
  QualityMetrics,
  MetricDetails,
} from '../common/entities/response.entity';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  calculateMetrics(prompt: string, response: string): QualityMetrics {
    const details = this.extractDetails(prompt, response);

    // Top 5 metrics only
    const coherenceScore = this.calculateCoherenceScore(details);
    const relevancyScore = this.calculateRelevancyScore(details);
    const completenessScore = this.calculateCompletenessScore(details);
    const repetitionScore = this.calculateRepetitionScore(details);
    const lengthScore = this.calculateLengthScore(details);

    // Weighted overall score (total: 100%)
    const overallScore =
      0.25 * coherenceScore + // 25% - Most important: quality of writing
      0.25 * relevancyScore + // 25% - Most important: addresses prompt
      0.2 * completenessScore + // 20% - Critical: not truncated
      0.2 * repetitionScore + // 20% - Critical: detects loops/failures
      0.1 * lengthScore; // 10% - Supporting: appropriate length

    return {
      coherenceScore,
      relevancyScore,
      completenessScore,
      repetitionScore,
      lengthScore,
      overallScore: Math.round(overallScore * 1000) / 1000,
      details,
    };
  }

  private extractDetails(prompt: string, response: string): MetricDetails {
    const words: string[] = response.match(/\b\w+\b/g) || [];
    const sentences: string[] = response.match(/[^.!?]+[.!?]+/g) || [];
    const paragraphs: string[] = response
      .split(/\n\s*\n/)
      .filter((p) => p.trim().length > 0);
    const uniqueWords: Set<string> = new Set(words.map((w) => w.toLowerCase()));
    const punctuation: string[] = response.match(/[.!?,;:]/g) || [];

    // Calculate repeated phrases
    const { repeatedPhrases, maxLength } = this.findRepeatedPhrases(response);

    // Extract keywords for relevancy
    const promptKeywords: string[] = this.extractKeywords(prompt);
    const responseKeywords: string[] = this.extractKeywords(response);
    const sharedKeywords: string[] = promptKeywords.filter((kw) =>
      responseKeywords.includes(kw),
    );

    const wordCount: number = words.length;
    const sentenceCount: number = sentences.length || 1;
    const avgSentenceLength: number = wordCount / sentenceCount;
    const avgWordLength: number =
      words.reduce((sum: number, word: string) => sum + word.length, 0) /
      (wordCount || 1);
    const uniqueWordRatio = uniqueWords.size / (wordCount || 1);
    const punctuationRatio = punctuation.length / (wordCount || 1);
    const keywordOverlapRatio =
      sharedKeywords.length / (promptKeywords.length || 1);

    return {
      wordCount,
      sentenceCount,
      avgSentenceLength,
      avgWordLength,
      uniqueWordRatio,
      punctuationRatio,
      paragraphCount: paragraphs.length,
      repeatedPhrases,
      hasProperEnding: /[.!?]$/.test(response.trim()),
      maxRepeatedPhraseLength: maxLength,
      promptKeywords,
      responseKeywords,
      sharedKeywords,
      keywordOverlapRatio,
    };
  }

  /**
   * Length Appropriateness Score (0-1)
   * Adaptive based on prompt length - short prompts can have short answers!
   */
  private calculateLengthScore(details: MetricDetails): number {
    const wordCount = details.wordCount;
    const promptLength = details.promptKeywords.length;

    // Determine optimal length based on prompt complexity
    // Simple question (few keywords) → shorter response is fine
    // Complex question (many keywords) → longer response expected
    let optimalLength: number;
    let tolerance: number;

    if (promptLength <= 3) {
      // Simple question: "Where is India?" → short answer is good
      optimalLength = 100;
      tolerance = 200;
    } else if (promptLength <= 6) {
      // Medium question: "Explain machine learning" → moderate answer
      optimalLength = 300;
      tolerance = 250;
    } else {
      // Complex question: "Explain quantum computing with examples" → detailed answer
      optimalLength = 500;
      tolerance = 300;
    }

    // Gaussian function centered at adaptive optimal length
    const score = Math.exp(
      -Math.pow(wordCount - optimalLength, 2) / (2 * tolerance * tolerance),
    );

    // Only penalize extremely short responses (< 10 words) regardless of prompt
    if (wordCount < 10) {
      return score * 0.3;
    }

    return Math.round(score * 1000) / 1000;
  }

  /**
   * Coherence Score (0-1)
   * Measures sentence structure quality and punctuation
   */
  private calculateCoherenceScore(details: MetricDetails): number {
    let score = 0;

    // Ideal average sentence length: 15-25 words
    const sentenceLengthScore = this.gaussianScore(
      details.avgSentenceLength,
      20,
      10,
    );
    score += sentenceLengthScore * 0.4;

    // Proper punctuation usage
    const punctuationScore = Math.min(details.punctuationRatio * 10, 1);
    score += punctuationScore * 0.3;

    // Has proper ending
    score += details.hasProperEnding ? 0.3 : 0;

    return Math.round(score * 1000) / 1000;
  }

  /**
   * Completeness Score (0-1)
   * Checks if response appears complete and not truncated
   * Adaptive - doesn't penalize short answers to short questions
   */
  private calculateCompletenessScore(details: MetricDetails): number {
    let score = 1.0;

    // Main indicator: proper ending
    if (!details.hasProperEnding) {
      score -= 0.6; // Major penalty for no proper ending
    }

    // Only penalize very short if it seems incomplete (< 10 words)
    // Short answers to short questions are fine!
    if (details.wordCount < 10 && !details.hasProperEnding) {
      score -= 0.4; // Likely truncated or failed
    }

    return Math.round(Math.max(score, 0) * 1000) / 1000;
  }

  /**
   * Repetition Score (0-1)
   * Penalizes repeated phrases and sentences
   * Higher score = less repetition (better)
   */
  private calculateRepetitionScore(details: MetricDetails): number {
    let score = 1.0;

    // Penalize based on number of repeated phrases
    const repetitionPenalty =
      (details.repeatedPhrases * details.maxRepeatedPhraseLength) /
      (details.wordCount || 1);
    score -= Math.min(repetitionPenalty * 2, 0.7);

    // Extra penalty for long repeated phrases
    if (details.maxRepeatedPhraseLength > 5) {
      score -= 0.2;
    }

    return Math.round(Math.max(score, 0) * 1000) / 1000;
  }

  /**
   * Relevancy Score (0-1)
   * Measures how well the response addresses the prompt
   * Uses keyword overlap and semantic similarity
   */
  private calculateRelevancyScore(details: MetricDetails): number {
    let score = 0;

    // Keyword overlap score (60% weight)
    const keywordScore = details.keywordOverlapRatio;
    score += keywordScore * 0.6;

    // Bonus if response contains most important keywords
    if (
      details.sharedKeywords.length >=
      Math.min(3, details.promptKeywords.length)
    ) {
      score += 0.2;
    }

    // Length appropriateness for prompt (20% weight)
    // Short prompts should have longer responses, long prompts can have shorter responses
    const promptWordCount = details.promptKeywords.length * 2; // Rough estimate
    const responseRatio =
      details.wordCount / Math.max(promptWordCount * 10, 100);
    const lengthScore = this.gaussianScore(responseRatio, 1, 2);
    score += lengthScore * 0.2;

    return Math.round(Math.min(score, 1) * 1000) / 1000;
  }

  /**
   * Helper: Find repeated phrases in text
   */
  private findRepeatedPhrases(text: string): {
    repeatedPhrases: number;
    maxLength: number;
  } {
    const words = text.match(/\b\w+\b/g) || [];
    const phrases: Map<string, number> = new Map();
    let maxLength = 0;
    let repeatedCount = 0;

    // Check for repeated 3-7 word phrases
    for (let phraseLength = 3; phraseLength <= 7; phraseLength++) {
      for (let i = 0; i <= words.length - phraseLength; i++) {
        const phrase = words
          .slice(i, i + phraseLength)
          .join(' ')
          .toLowerCase();
        const count = phrases.get(phrase) || 0;
        phrases.set(phrase, count + 1);

        if (count === 1) {
          // Found a repetition
          repeatedCount++;
          maxLength = Math.max(maxLength, phraseLength);
        }
      }
    }

    return { repeatedPhrases: repeatedCount, maxLength };
  }

  /**
   * Helper: Extract important keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Remove common stop words
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'as',
      'is',
      'was',
      'are',
      'were',
      'been',
      'be',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'can',
      'this',
      'that',
      'these',
      'those',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
      'what',
      'which',
      'who',
      'when',
      'where',
      'why',
      'how',
    ]);

    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const keywords = words.filter(
      (word) => word.length > 3 && !stopWords.has(word),
    );

    // Return unique keywords
    return Array.from(new Set(keywords));
  }

  /**
   * Helper: Gaussian scoring function
   */
  private gaussianScore(
    value: number,
    optimal: number,
    tolerance: number,
  ): number {
    return Math.exp(
      -Math.pow(value - optimal, 2) / (2 * tolerance * tolerance),
    );
  }
}
