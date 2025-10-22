"use client";

import { ExperimentCard } from "@/components/experiments/experiment-card";
import { CreateExperimentDialog } from "@/components/experiments/create-experiment-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FlaskConical, Loader2 } from "lucide-react";
import { useExperiments } from "@/hooks/use-experiments";

export default function Home() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useExperiments(10);

  // Flatten all pages into a single array of experiments
  const experiments = data?.pages.flatMap((page) => page.experiments) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <FlaskConical className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">LLM Lab</h1>
              <p className="text-muted-foreground mt-1">
                Experiment with different LLM parameters and compare responses
              </p>
            </div>
          </div>
          <CreateExperimentDialog />
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6">
            Failed to load experiments
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[300px] rounded-xl" />
              </div>
            ))}
          </div>
        ) : experiments.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-block p-6 bg-muted/50 rounded-full mb-4">
              <FlaskConical className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No experiments yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first experiment to start comparing LLM responses
            </p>
            <CreateExperimentDialog />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {experiments.map((experiment) => (
                <ExperimentCard key={experiment.id} experiment={experiment} />
              ))}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  size="lg"
                  variant="outline"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    "Load More Experiments"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
