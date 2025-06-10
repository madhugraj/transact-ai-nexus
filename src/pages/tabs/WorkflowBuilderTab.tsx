
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    console.log('📝 WorkflowBuilderTab handling save for:', workflow.name);
    try {
      onWorkflowSave(workflow);
      console.log('✅ Workflow save handled successfully');
    } catch (error) {
      console.error('❌ Failed to handle workflow save:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save workflow. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleWorkflowExecute = async (workflow: WorkflowConfig) => {
    console.log('▶️ WorkflowBuilderTab handling execution for:', workflow.name);
    setValidationErrors([]);

    try {
      // Validate workflow requirements
      const validation = await enhancedEngine.validateWorkflowRequirements(workflow);
      
      if (!validation.valid) {
        console.log('❌ Workflow validation failed:', validation.errors);
        setValidationErrors(validation.errors);
        toast({
          title: "Workflow Validation Failed",
          description: "Please fix the authentication issues before running the workflow.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Workflow validation passed, executing...');
      // Execute the workflow using enhanced engine
      await onWorkflowExecute(workflow);

    } catch (error) {
      console.error('❌ Workflow execution error:', error);
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
          <CardTitle>Enhanced Workflow Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{workflows.length}</div>
              <div className="text-sm text-muted-foreground">Saved Workflows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">11</div>
              <div className="text-sm text-muted-foreground">Database Tables</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">Enhanced</div>
              <div className="text-sm text-muted-foreground">Processing Engine</div>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Build your complete workflow:</strong></p>
            <p>• Drag components from the collapsible sidebar to the canvas</p>
            <p>• Double-click components to configure them with specific settings</p>
            <p>• Connect components by dragging between connection points</p>
            <p>• Use all 11 database tables for flexible data storage</p>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Drag and Drop Workflow Builder */}
      <DragDropWorkflowBuilder
        onWorkflowSave={handleWorkflowSave}
        onWorkflowExecute={handleWorkflowExecute}
      />
    </div>
  );
};
