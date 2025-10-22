import {
  ExperimentsListResponse,
  ExperimentDetail,
  CreateExperimentRequest,
  CreateExperimentResponse,
} from '@/types/experiment';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(API_BASE_URL + endpoint, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!response.ok) {
    throw new ApiError('API Error: ' + response.status, response.status);
  }
  return response.json();
}

export const experimentApi = {
  async getAll(
    nextCursor: string | null = null,
    limit: number = 10
  ): Promise<{ 
    experiments: ExperimentsListResponse['experiments'], 
    hasNextPage: boolean, 
    nextCursor: string | null 
  }> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (nextCursor) {
      params.append('cursor', nextCursor);
    }
    
    const data = await fetchApi<ExperimentsListResponse>(`/experiments?${params.toString()}`);
    return {
      experiments: data.experiments,
      hasNextPage: data.hasMore,
      nextCursor: data.nextCursor
    };
  },
  async getById(id: string): Promise<ExperimentDetail> {
    return fetchApi('/experiments/' + id);
  },
  /**
   * Create experiment with SSE streaming
   * @param data - Experiment creation data
   * @param onProgress - Callback for progress events
   */
  async createWithStream(
    data: CreateExperimentRequest,
    onProgress?: (event: {
      type: string;
      message: string;
      progress: { current: number; total: number; percentage: number };
      data?: any;
    }) => void
  ): Promise<CreateExperimentResponse> {
    const response = await fetch(`${API_BASE_URL}/experiments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new ApiError('API Error: ' + response.status, response.status);
    }

    if (!response.body) {
      throw new ApiError('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let experimentId = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (lines ending with \n\n)
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep incomplete message in buffer

        for (const message of messages) {
          if (message.startsWith('data: ')) {
            const jsonData = message.slice(6); // Remove 'data: ' prefix
            try {
              const event = JSON.parse(jsonData);
              
              // Store experimentId from first event
              if (event.data?.experimentId) {
                experimentId = event.data.experimentId;
              }

              // Call progress callback
              onProgress?.(event);
            } catch (e) {
              console.error('Error parsing SSE message:', e);
            }
          }
        }
      }

      return {
        experimentId,
        status: 'completed',
        message: 'Experiment created successfully',
      };
    } catch (error) {
      console.error('Stream error:', error);
      throw new ApiError(
        error instanceof Error ? error.message : 'Stream error'
      );
    } finally {
      reader.releaseLock();
    }
  },
  async delete(id: string): Promise<void> {
    return fetchApi('/experiments/' + id, { method: 'DELETE' });
  },
};
