"use client";

import { Experiment } from "@/types/experiment";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface ExperimentCardProps {
  experiment: Experiment;
}

export function ExperimentCard({ experiment }: ExperimentCardProps) {
  const statusConfig = {
    completed: { color: "default" as const, icon: CheckCircle2, label: "Completed" },
    processing: { color: "secondary" as const, icon: Loader2, label: "Processing" },
    pending: { color: "outline" as const, icon: Clock, label: "Pending" },
    failed: { color: "destructive" as const, icon: XCircle, label: "Failed" },
  };

  const config = statusConfig[experiment.status];
  const StatusIcon = config.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{experiment.prompt}</CardTitle>
            <CardDescription className="mt-1">
              Created {formatDate(experiment.createdAt)}
            </CardDescription>
          </div>
          <Badge variant={config.color} className="ml-2 flex items-center gap-1">
            <StatusIcon className={`h-3 w-3 ${experiment.status === 'processing' ? 'animate-spin' : ''}`} />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Responses</p>
            <p className="font-medium">
              {experiment.totalResponses}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Avg Score</p>
            <p className="font-medium">
              {experiment.averageScore ? (experiment.averageScore * 100).toFixed(1) + "%" : "N/A"}
            </p>
          </div>
        </div>
        {experiment.bestResponse && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">BEST RESPONSE</p>
              <Badge variant="secondary" className="text-xs">
                {(experiment.bestResponse.overallScore * 100).toFixed(1)}%
              </Badge>
            </div>
            <p className="text-sm line-clamp-3">{experiment.bestResponse.responseText}</p>
            <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
              <span>Temp: {experiment.bestResponse.parameters.temperature}</span>
              <span>•</span>
              <span>Top-P: {experiment.bestResponse.parameters.topP}</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-self-end">
        <Link href={`/experiments/${experiment.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
