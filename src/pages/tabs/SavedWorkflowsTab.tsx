
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, BarChart3 } from 'lucide-react';
import { WorkflowConfig } from '@/types/workflow';
import WorkflowCard from '@/components/actions/WorkflowCard';

interface SavedWorkflowsTabProps {
  workflows: WorkflowConfig[];
  onExecuteWorkflow: (workflow: WorkflowConfig) => void;
  onCreateFirst: () => void;
  onEditWorkflow?: (workflow: WorkflowConfig) => void;
  onDeleteWorkflow?: (workflowId: string) => void;
  isExecuting: boolean;
}

export const SavedWorkflowsTab: React.FC<SavedWorkflowsTabProps> = ({
  workflows,
  onExecuteWorkflow,
  onCreateFirst,
  onEditWorkflow,
  onDeleteWorkflow,
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
        <WorkflowCard
          key={workflow.id}
          workflow={workflow}
          onEdit={onEditWorkflow}
          onDelete={onDeleteWorkflow}
        />
      ))}
    </div>
  );
};
