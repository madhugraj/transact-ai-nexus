
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WorkflowBuilder } from '@/components/workflow/WorkflowBuilder';
import { useWorkflowPersistence } from '@/hooks/useWorkflowPersistence';
import { useToast } from '@/hooks/use-toast';
import { EnhancedWorkflowEngine } from '@/services/workflow/EnhancedWorkflowEngine';
import { WorkflowConfig, WorkflowStep } from '@/types/workflow';
import { Play, AlertTriangle } from 'lucide-react';

interface WorkflowBuilderTabProps {
  onWorkflowSave: (workflow: WorkflowConfig) => void;
  onWorkflowExecute: (workflow: WorkflowConfig) => Promise<void>;
}

export const WorkflowBuilderTab: React.FC<WorkflowBuilderTabProps> = ({
  onWorkflowSave,
  onWorkflowExecute
}) => {
  const { workflows, addWorkflow } = useWorkflowPersistence();
  const { toast } = useToast();
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowConfig>({
    id: `workflow-${Date.now()}`,
    name: 'New Workflow',
    description: 'Document processing workflow',
    steps: [],
    connections: [],
    isActive: true,
    createdAt: new Date(),
    totalRuns: 0,
    successRate: 0
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const enhancedEngine = new EnhancedWorkflowEngine();

  const handleWorkflowChange = (updatedWorkflow: WorkflowConfig) => {
    setCurrentWorkflow(updatedWorkflow);
    setValidationErrors([]); // Clear validation errors when workflow changes
  };

  const handleStepDoubleClick = (step: WorkflowStep) => {
    console.log('Step double-clicked for configuration:', step.name);
    // Step configuration is handled by the WorkflowBuilder component
  };

  const handleSaveWorkflow = () => {
    if (currentWorkflow.steps.length === 0) {
      toast({
        title: "Cannot Save Empty Workflow",
        description: "Please add at least one component to the workflow",
        variant: "destructive"
      });
      return;
    }

    const workflowToSave = {
      ...currentWorkflow,
      id: `workflow-${Date.now()}`,
      createdAt: new Date()
    };

    addWorkflow(workflowToSave);
    onWorkflowSave(workflowToSave);
    
    // Reset to new workflow
    setCurrentWorkflow({
      id: `workflow-${Date.now()}`,
      name: 'New Workflow',
      description: 'Document processing workflow',
      steps: [],
      connections: [],
      isActive: true,
      createdAt: new Date(),
      totalRuns: 0,
      successRate: 0
    });
  };

  const handleExecuteWorkflow = async () => {
    if (currentWorkflow.steps.length === 0) {
      toast({
        title: "Cannot Execute Empty Workflow",
        description: "Please add at least one component to the workflow",
        variant: "destructive"
      });
      return;
    }

    setIsExecuting(true);
    setValidationErrors([]);

    try {
      // Validate workflow requirements
      const validation = await enhancedEngine.validateWorkflowRequirements(currentWorkflow);
      
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
      await onWorkflowExecute(currentWorkflow);

    } catch (error) {
      console.error('Workflow execution error:', error);
      toast({
        title: "Workflow Execution Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
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
          <CardTitle className="flex items-center justify-between">
            <span>Workflow Builder - Enhanced Processing</span>
            <div className="flex gap-2">
              <Button 
                onClick={handleSaveWorkflow}
                disabled={currentWorkflow.steps.length === 0}
                variant="outline"
              >
                Save Workflow
              </Button>
              <Button 
                onClick={handleExecuteWorkflow}
                disabled={currentWorkflow.steps.length === 0 || isExecuting}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                {isExecuting ? 'Executing...' : 'Execute Workflow'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{currentWorkflow.steps.length}</div>
              <div className="text-sm text-muted-foreground">Components</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{currentWorkflow.connections.length}</div>
              <div className="text-sm text-muted-foreground">Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{workflows.length}</div>
              <div className="text-sm text-muted-foreground">Saved Workflows</div>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Planned Workflow:</strong></p>
            <p>Gmail Source → Extract Data (Invoice) → Store Data 1</p>
            <p>Drive Source → Extract Data (PO) → Store Data 2</p>
            <p>Store Data 1 + Store Data 2 → Process Data → Store Data 3 & Store Data 4</p>
            <p>Store Data 3 & Store Data 4 → Generate Report → Send Alert</p>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Builder */}
      <Card className="h-[600px]">
        <CardContent className="p-0 h-full">
          <WorkflowBuilder
            workflow={currentWorkflow}
            onWorkflowChange={handleWorkflowChange}
            onStepDoubleClick={handleStepDoubleClick}
          />
        </CardContent>
      </Card>
    </div>
  );
};
