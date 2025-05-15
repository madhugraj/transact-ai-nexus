
import React from 'react';
import { Brain } from 'lucide-react';

interface ProcessingStatsProps {
  processingResults: any;
}

const ProcessingStats: React.FC<ProcessingStatsProps> = ({ processingResults }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="p-3 border rounded-md bg-muted/10">
        <div className="text-xs text-muted-foreground">Processing ID</div>
        <div className="font-medium truncate">{processingResults.processingId || 'Unknown'}</div>
      </div>
      <div className="p-3 border rounded-md bg-muted/10">
        <div className="text-xs text-muted-foreground">Tables Extracted</div>
        <div className="font-medium">{processingResults.tableCount || 0}</div>
      </div>
      <div className="p-3 border rounded-md bg-muted/10">
        <div className="text-xs text-muted-foreground">Status</div>
        <div className="font-medium">
          {processingResults.extractionComplete ? "Complete" : "Processing"}
        </div>
      </div>
      <div className="p-3 border rounded-md bg-muted/10">
        <div className="text-xs text-muted-foreground">AI Provider</div>
        <div className="font-medium flex items-center">
          <Brain className="h-3.5 w-3.5 mr-1 text-blue-500" />
          Gemini
        </div>
      </div>
    </div>
  );
};

export default ProcessingStats;
