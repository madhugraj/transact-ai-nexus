
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Play } from 'lucide-react';
import { WorkflowExecution, WorkflowStepResult } from '@/types/workflow';

interface ExecutionTrackerProps {
  execution: WorkflowExecution | null;
}

export const ExecutionTracker: React.FC<ExecutionTrackerProps> = ({ execution }) => {
  if (!execution) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No executions yet</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Play className="h-4 w-4 text-blue-600 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: 'default',
      failed: 'destructive',
      running: 'secondary',
      pending: 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const duration = execution.endTime 
    ? Math.round((new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime()) / 1000)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Execution Status</span>
          {getStatusBadge(execution.status)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Started:</span>
              <div>{new Date(execution.startTime).toLocaleString()}</div>
            </div>
            {execution.endTime && (
              <div>
                <span className="font-medium">Duration:</span>
                <div>{duration}s</div>
              </div>
            )}
            <div>
              <span className="font-medium">Steps:</span>
              <div>{execution.stepResults.length} total</div>
            </div>
            <div>
              <span className="font-medium">Processed:</span>
              <div>{execution.processedDocuments || 0} documents</div>
            </div>
          </div>

          {execution.stepResults.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Step Results:</h4>
              <div className="space-y-2">
                {execution.stepResults.map((stepResult: WorkflowStepResult, index: number) => (
                  <div key={stepResult.stepId} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(stepResult.status)}
                      <span className="text-sm">Step {index + 1}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stepResult.endTime 
                        ? Math.round((new Date(stepResult.endTime).getTime() - new Date(stepResult.startTime).getTime()) / 1000) + 's'
                        : 'Running...'
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {execution.errors && execution.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-red-600 mb-2">Errors:</h4>
              <div className="bg-red-50 p-2 rounded text-sm">
                {execution.errors.map((error: string, index: number) => (
                  <div key={index} className="text-red-700">{error}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
