import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trophy } from "lucide-react";
import Link from "next/link";
import { API_BASE_URL } from "@/app/lib/api";
import { ExperimentMetricsDto } from "@/types/experiment";
import { ExportButtons } from "@/components/experiments/export-buttons";

export default async function ExperimentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  let metricsData: ExperimentMetricsDto | null = null;
  let errorMessage: string | null = null;

  try {
    const apiUrl = `${API_BASE_URL}/experiments/${id}/metrics`;
    
    const metricsResponse = await fetch(apiUrl, {
      cache: 'no-store',
    });
    
    if (!metricsResponse.ok) {
      errorMessage = `Failed to fetch metrics: ${metricsResponse.status}`;
    } else {
      const data = await metricsResponse.json();
      
      if (data && data.metrics) {
        metricsData = data.metrics as ExperimentMetricsDto;
      } else {
        errorMessage = "Invalid response structure from API";
        console.error('Invalid structure. Data keys:', Object.keys(data || {}));
      }
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error('Error fetching metrics:', error);
  }

  if (!metricsData || errorMessage) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <Link href="/">
            <Button variant="outline" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Experiments
            </Button>
          </Link>
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
            {errorMessage || "Failed to load experiment details"}
          </div>
        </div>
      </div>
    );
  }

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1) + "%";
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 dark:text-green-400";
    if (score >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header with Back and Export buttons */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 mb-6">
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Experiments
            </Button>
          </Link>
          <ExportButtons experimentId={id} apiBaseUrl={API_BASE_URL} />
        </div>

        {/* Experiment Overview Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{metricsData.prompt}</CardTitle>
            <CardDescription>Experiment ID: {metricsData.experimentId}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Total Responses</p>
                <p className="text-2xl font-bold">{metricsData.summary.totalResponses}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  <p className="text-xs text-muted-foreground">Best Score</p>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatScore(metricsData.summary.bestScore)}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Average Score</p>
                <p className="text-2xl font-bold">
                  {formatScore(metricsData.summary.averageScore)}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Worst Score</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatScore(metricsData.summary.worstScore)}
                </p>
              </div>
            </div>

            {/* Metric Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">Score by Temperature</h3>
                <div className="space-y-2">
                  {Object.entries(metricsData.metricBreakdown.byTemperature)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([temp, score]) => (
                      <div key={temp} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Temp {temp}</span>
                        <Badge variant="outline" className={getScoreColor(score)}>
                          {formatScore(score)}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">Score by Top-P</h3>
                <div className="space-y-2">
                  {Object.entries(metricsData.metricBreakdown.byTopP)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([topP, score]) => (
                      <div key={topP} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Top-P {topP}</span>
                        <Badge variant="outline" className={getScoreColor(score)}>
                          {formatScore(score)}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Response Comparison</CardTitle>
            <CardDescription>
              Compare all responses generated with different parameter combinations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metricsData.responses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No responses available
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Rank</TableHead>
                      <TableHead className="w-[120px]">Overall Score</TableHead>
                      <TableHead className="w-[100px]">Temperature</TableHead>
                      <TableHead className="w-[80px]">Top-P</TableHead>
                      <TableHead className="w-[100px]">Max Tokens</TableHead>
                      <TableHead className="w-[110px]">Coherence</TableHead>
                      <TableHead className="w-[120px]">Completeness</TableHead>
                      <TableHead className="w-[110px]">Relevancy</TableHead>
                      <TableHead className="w-[110px]">Repetition</TableHead>
                      <TableHead className="min-w-[300px]">Response Preview</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metricsData.responses
                      .sort((a, b) => b.metrics.overallScore - a.metrics.overallScore)
                      .map((response, index) => (
                        <TableRow
                          key={response.id}
                          className={index === 0 ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}
                        >
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {index === 0 && <Trophy className="h-4 w-4 text-yellow-600" />}
                              <span className="font-medium">#{index + 1}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getScoreColor(response.metrics.overallScore)}
                            >
                              {formatScore(response.metrics.overallScore)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {response.parameters.temperature}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {response.parameters.topP}
                          </TableCell>
                          <TableCell className="text-sm">
                            {response.parameters.maxTokens}
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className={getScoreColor(response.metrics.coherenceScore)}>
                              {formatScore(response.metrics.coherenceScore)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className={getScoreColor(response.metrics.completenessScore)}>
                              {formatScore(response.metrics.completenessScore)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className={getScoreColor(response.metrics.relevancyScore)}>
                              {formatScore(response.metrics.relevancyScore)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className={getScoreColor(response.metrics.repetitionScore)}>
                              {formatScore(response.metrics.repetitionScore)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm line-clamp-3">{response.responsePreview}</p>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
