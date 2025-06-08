
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkflowCanvas from './WorkflowCanvas';
import { WorkflowStepPalette } from './WorkflowStepPalette';
import { WorkflowStep, WorkflowConnection, WorkflowConfig } from '@/types/workflow';
import { Palette, Workflow, Settings } from 'lucide-react';

interface StepTemplate {
  type: string;
  name: string;
  description: string;
  category: string;
}

interface WorkflowBuilderProps {
  workflow: WorkflowConfig;
  onWorkflowChange: (workflow: WorkflowConfig) => void;
  onStepDoubleClick?: (step: WorkflowStep) => void;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  workflow,
  onWorkflowChange,
  onStepDoubleClick
}) => {
  const [activeTab, setActiveTab] = useState('canvas');

  const handleAddStep = (template: StepTemplate) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type: template.type as any,
      name: template.name,
      description: template.description,
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 300 + 100 
      },
      config: {}
    };

    const updatedWorkflow = {
      ...workflow,
      steps: [...workflow.steps, newStep]
    };

    onWorkflowChange(updatedWorkflow);
    setActiveTab('canvas'); // Switch to canvas to see the new step
  };

  const handleStepsChange = (steps: WorkflowStep[]) => {
    onWorkflowChange({ ...workflow, steps });
  };

  const handleConnectionsChange = (connections: WorkflowConnection[]) => {
    onWorkflowChange({ ...workflow, connections });
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="palette" className="gap-2">
            <Palette className="h-4 w-4" />
            Component Library
          </TabsTrigger>
          <TabsTrigger value="canvas" className="gap-2">
            <Workflow className="h-4 w-4" />
            Workflow Canvas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="palette" className="flex-1 p-4 overflow-y-auto">
          <WorkflowStepPalette onAddStep={handleAddStep} />
        </TabsContent>

        <TabsContent value="canvas" className="flex-1 p-0">
          <div className="h-full">
            <WorkflowCanvas
              steps={workflow.steps}
              connections={workflow.connections}
              onStepsChange={handleStepsChange}
              onConnectionsChange={handleConnectionsChange}
              onStepDoubleClick={onStepDoubleClick}
              isEditable={true}
            />
          </div>
        </TabsContent>
      </Tabs>

      {workflow.steps.length > 0 && (
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{workflow.steps.length} steps, {workflow.connections.length} connections</span>
            <span className="flex items-center gap-1">
              <Settings className="h-3 w-3" />
              Double-click steps to configure
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
