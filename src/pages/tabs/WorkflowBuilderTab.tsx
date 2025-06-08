
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReactFlowProvider } from '@xyflow/react';
import { DragDropWorkflowBuilder } from '@/components/workflow/DragDropWorkflowBuilder';
import { WorkflowConfig } from '@/types/workflow';

interface WorkflowBuilderTabProps {
  onWorkflowSave: (workflow: WorkflowConfig) => void;
  onWorkflowExecute: (workflow: WorkflowConfig) => void;
}

export const WorkflowBuilderTab: React.FC<WorkflowBuilderTabProps> = ({
  onWorkflowSave,
  onWorkflowExecute
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Drag & Drop Workflow Builder</CardTitle>
        <p className="text-sm text-muted-foreground">
          Drag components from the left panel to the canvas and connect them to build your workflow.
        </p>
      </CardHeader>
      <CardContent>
        <ReactFlowProvider>
          <DragDropWorkflowBuilder
            onWorkflowSave={onWorkflowSave}
            onWorkflowExecute={onWorkflowExecute}
          />
        </ReactFlowProvider>
      </CardContent>
    </Card>
  );
};
