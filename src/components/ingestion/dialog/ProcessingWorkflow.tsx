
import React from 'react';
import { ArrowRight } from 'lucide-react';

export const ProcessingWorkflow: React.FC = () => {
  return (
    <div className="bg-muted/60 p-4 rounded-md mt-4">
      <h4 className="text-sm font-medium mb-2">Processing Workflow</h4>
      <div className="flex items-center justify-between text-sm">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
            1
          </div>
          <span className="text-xs mt-1">Process</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center">
            2
          </div>
          <span className="text-xs mt-1">Dashboard</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center">
            3
          </div>
          <span className="text-xs mt-1">AI Assistant</span>
        </div>
      </div>
    </div>
  );
};
