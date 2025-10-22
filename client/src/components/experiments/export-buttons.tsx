"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportButtonsProps {
  experimentId: string;
  apiBaseUrl: string;
}

export function ExportButtons({ experimentId, apiBaseUrl }: ExportButtonsProps) {
  const handleExport = (format: 'json' | 'csv') => {
    window.open(`${apiBaseUrl}/experiments/${experimentId}/export?format=${format}`, '_blank');
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => handleExport('json')}
      >
        <Download className="mr-2 h-4 w-4" />
        Export JSON
      </Button>
      <Button
        variant="outline"
        onClick={() => handleExport('csv')}
      >
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
    </div>
  );
}
