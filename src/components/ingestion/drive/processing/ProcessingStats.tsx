
import React from 'react';
import { CheckCircle, XCircle, FileText, Loader } from 'lucide-react';

interface ProcessingStatsProps {
  results: any[];
  isProcessing: boolean;
}

const ProcessingStats = ({ results, isProcessing }: ProcessingStatsProps) => {
  if (results.length === 0 && !isProcessing) return null;

  const successCount = results.filter(r => r.status === 'success').length;
  const poCount = results.filter(r => r.isPO).length;
  const errorCount = results.filter(r => r.status === 'error').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped':
        return <FileText className="h-4 w-4 text-yellow-500" />;
      default:
        return <Loader className="h-4 w-4 animate-spin" />;
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        Found {poCount} PO files, successfully stored {successCount} records
        {errorCount > 0 && `, ${errorCount} errors`}
      </div>
      
      {results.length > 0 && (
        <div className="max-h-40 overflow-y-auto space-y-1 border rounded p-2">
          {results.map((result, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              {getStatusIcon(result.status)}
              <span className="flex-1 truncate">{result.fileName}</span>
              <span className="text-muted-foreground">
                {result.isPO ? 'PO' : 'Not PO'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProcessingStats;
