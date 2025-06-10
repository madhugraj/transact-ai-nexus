
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DragDropWorkflowBuilder } from '@/components/workflow/DragDropWorkflowBuilder';
import { useWorkflowPersistence } from '@/hooks/useWorkflowPersistence';
import { useToast } from '@/hooks/use-toast';
import { EnhancedWorkflowEngine } from '@/services/workflow/EnhancedWorkflowEngine';
import { WorkflowConfig } from '@/types/workflow';
import { AlertTriangle } from 'lucide-react';

interface WorkflowBuilderTabProps {
  onWorkflowSave: (workflow: WorkflowConfig) => void;
  onWorkflowExecute: (workflow: WorkflowConfig) => Promise<void>;
}

export const WorkflowBuilderTab: React.FC<WorkflowBuilderTabProps> = ({
  onWorkflowSave,
  onWorkflowExecute
}) => {
  const { workflows } = useWorkflowPersistence();
  const { toast } = useToast();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const enhancedEngine = new EnhancedWorkflowEngine();

  const handleWorkflowSave = (workflow: WorkflowConfig) => {
    onWorkflowSave(workflow);
    toast({
      title: "Workflow Saved",
      description: `"${workflow.name}" has been saved successfully.`,
    });
  };

  const handleWorkflowExecute = async (workflow: WorkflowConfig) => {
    setValidationErrors([]);

    try {
      // Validate workflow requirements
      const validation = await enhancedEngine.validateWorkflowRequirements(workflow);
      
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        toast({
          title: "Workflow Validation Failed",
          description: "Please fix the authentication issues before running the workflow.",
          variant: "destructive",
        });
        return;
      }

      // Execute the workflow using enhanced engine
      await onWorkflowExecute(workflow);

    } catch (error) {
      console.error('Workflow execution error:', error);
      toast({
        title: "Workflow Execution Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Please fix these issues before running the workflow:</p>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Workflow Info */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Builder - Enhanced Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{workflows.length}</div>
              <div className="text-sm text-muted-foreground">Saved Workflows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">Enhanced</div>
              <div className="text-sm text-muted-foreground">Processing Engine</div>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Drag components from the left panel to the canvas to build your workflow:</strong></p>
            <p>Gmail Source → Extract Data (Invoice) → Store Data 1</p>
            <p>Drive Source → Extract Data (PO) → Store Data 2</p>
            <p>Store Data 1 + Store Data 2 → Process Data → Store Data 3 & Store Data 4</p>
            <p>Store Data 3 & Store Data 4 → Generate Report → Send Alert</p>
          </div>
        </CardContent>
      </Card>

      {/* Drag and Drop Workflow Builder */}
      <DragDropWorkflowBuilder
        onWorkflowSave={handleWorkflowSave}
        onWorkflowExecute={handleWorkflowExecute}
      />
    </div>
  );
};
