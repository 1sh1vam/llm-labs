/**
 * Simple progress event for streaming
 */
export interface ProgressEvent {
  type: string;
  message: string;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  data?: any;
}

/**
 * Progress callback function
 */
export type ProgressCallback = (event: ProgressEvent) => void;
