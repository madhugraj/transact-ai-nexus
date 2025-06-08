
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, BarChart3 } from 'lucide-react';
import { WorkflowConfig } from '@/types/workflow';

interface SavedWorkflowsTabProps {
  workflows: WorkflowConfig[];
  onExecuteWorkflow: (workflow: WorkflowConfig) => void;
  onCreateFirst: () => void;
  isExecuting: boolean;
}

export const SavedWorkflowsTab: React.FC<SavedWorkflowsTabProps> = ({
  workflows,
  onExecuteWorkflow,
  onCreateFirst,
  isExecuting
}) => {
  if (workflows.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-2">No Workflows Created</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Use the Workflow Builder tab to create your first workflow
          </p>
          <Button onClick={onCreateFirst}>
            Create First Workflow
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {workflows.map((workflow) => (
        <Card key={workflow.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{workflow.name}</CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onExecuteWorkflow(workflow)}
                  disabled={isExecuting}
                >
                  <PlayCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {workflow.description}
            </p>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{workflow.steps.length} steps</span>
              <span>
                {workflow.lastRun 
                  ? `Last run: ${workflow.lastRun.toLocaleDateString()}`
                  : 'Never run'
                }
              </span>
            </div>
            {workflow.successRate !== undefined && (
              <div className="mt-2 text-xs">
                Success rate: {workflow.successRate}%
              </div>
            )}
            <div className="mt-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {workflow.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
