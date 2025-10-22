"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { experimentApi } from "@/app/lib/api";
import { CreateExperimentRequest, ExperimentStatus } from "@/types/experiment";

export const experimentKeys = {
  all: ["experiments"] as const,
  lists: () => [...experimentKeys.all, "list"] as const,
  list: (limit: number) =>
    [...experimentKeys.lists(), { limit }] as const,
  details: () => [...experimentKeys.all, "detail"] as const,
  detail: (id: string) => [...experimentKeys.details(), id] as const,
};

export function useExperiments(limit = 10) {
  const query = useInfiniteQuery({
    queryKey: experimentKeys.list(limit),
    queryFn: ({ pageParam }) => experimentApi.getAll(pageParam, limit),
    getNextPageParam: (lastPage) => {
      // Return the nextCursor if there are more pages, undefined otherwise
      return lastPage.hasNextPage ? lastPage.nextCursor : undefined;
    },
    initialPageParam: null as string | null,
  });

  return query;
}

export function useExperiment(id: string) {
  const query = useQuery({
    queryKey: experimentKeys.detail(id),
    queryFn: () => experimentApi.getById(id),
    enabled: false,
    refetchOnMount: true,
  });


  return query;
}

export function useCreateExperiment(
  onProgress?: (event: {
    type: string;
    message: string;
    progress: { current: number; total: number; percentage: number };
    data?: any;
  }) => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExperimentRequest) => 
      experimentApi.createWithStream(data, onProgress),
    onSuccess: () => {
      // Invalidate and refetch experiments list
      queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
    },
  });
}
