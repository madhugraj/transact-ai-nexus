
import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DragDropWorkflowBuilder } from '@/components/workflow/DragDropWorkflowBuilder';
import { useWorkflowPersistence } from '@/hooks/useWorkflowPersistence';
import { useToast } from '@/hooks/use-toast';
import { EnhancedWorkflowEngine } from '@/services/workflow/EnhancedWorkflowEngine';
import { WorkflowConfig } from '@/types/workflow';
import { AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkflowBuilderTabProps {
  onWorkflowSave: (workflow: WorkflowConfig) => void;
  onWorkflowExecute: (workflow: WorkflowConfig) => Promise<void>;
  currentWorkflow?: WorkflowConfig | null;
  onClearCurrentWorkflow?: () => void;
}

export const WorkflowBuilderTab: React.FC<WorkflowBuilderTabProps> = ({
  onWorkflowSave,
  onWorkflowExecute,
  currentWorkflow,
  onClearCurrentWorkflow
}) => {
  const { workflows } = useWorkflowPersistence();
  const { toast } = useToast();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const enhancedEngine = new EnhancedWorkflowEngine();

  const handleWorkflowSave = (workflow: WorkflowConfig) => {
    console.log('🔄 Saving workflow in WorkflowBuilderTab:', workflow.name);
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

  const handleClearTemplate = () => {
    if (onClearCurrentWorkflow) {
      onClearCurrentWorkflow();
      toast({
        title: "Template Cleared",
        description: "You can now create a new workflow from scratch.",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Template/Workflow Info */}
      {currentWorkflow && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">Editing: {currentWorkflow.name}</h3>
                <p className="text-sm text-blue-700">{currentWorkflow.description}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearTemplate}
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
            >
              Clear & Start Fresh
            </Button>
          </div>
        </div>
      )}

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

      {/* Drag and Drop Workflow Builder */}
      <DragDropWorkflowBuilder
        onWorkflowSave={handleWorkflowSave}
        onWorkflowExecute={handleWorkflowExecute}
        initialWorkflow={currentWorkflow}
      />
    </div>
  );
};
