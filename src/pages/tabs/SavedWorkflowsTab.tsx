
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, BarChart3, Trash2, RefreshCw } from 'lucide-react';
import { WorkflowConfig } from '@/types/workflow';
import WorkflowCard from '@/components/actions/WorkflowCard';
import { useWorkflowPersistence } from '@/hooks/useWorkflowPersistence';
import { useToast } from '@/hooks/use-toast';
import { RealWorkflowEngine } from '@/services/workflow/RealWorkflowEngine';

interface SavedWorkflowsTabProps {
  workflows: WorkflowConfig[];
  onExecuteWorkflow: (workflow: WorkflowConfig) => void;
  onCreateFirst: () => void;
  onEditWorkflow?: (workflow: WorkflowConfig) => void;
  isExecuting: boolean;
}

export const SavedWorkflowsTab: React.FC<SavedWorkflowsTabProps> = ({
  workflows,
  onExecuteWorkflow,
  onCreateFirst,
  onEditWorkflow,
  isExecuting
}) => {
  const { deleteWorkflow, clearAllWorkflows, debugStorage, updateWorkflow } = useWorkflowPersistence();
  const { toast } = useToast();
  const [executingWorkflowId, setExecutingWorkflowId] = React.useState<string | null>(null);

  const workflowEngine = new RealWorkflowEngine();

  const handleExecuteWorkflow = async (workflow: WorkflowConfig) => {
    console.log('🚀 Executing workflow from saved workflows:', workflow.name);
    
    setExecutingWorkflowId(workflow.id);
    
    try {
      // Validate workflow requirements first
      const validation = await workflowEngine.validateWorkflowRequirements(workflow);
      
      if (!validation.valid) {
        toast({
          title: "Workflow Validation Failed",
          description: validation.errors.join(', '),
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Workflow Starting",
        description: `Executing "${workflow.name}"...`,
      });

      // Execute the workflow
      const result = await workflowEngine.executeWorkflow(workflow);
      
      if (result.status === 'completed') {
        // Update workflow stats
        const successfulSteps = result.stepResults.filter(r => r.status === 'completed').length;
        const totalSteps = result.stepResults.length;
        const successRate = Math.round((successfulSteps / totalSteps) * 100);
        
        updateWorkflow(workflow.id, {
          lastRun: new Date(),
          totalRuns: (workflow.totalRuns || 0) + 1,
          successRate: successRate
        });

        toast({
          title: "Workflow Completed",
          description: `"${workflow.name}" executed successfully with ${successfulSteps}/${totalSteps} steps completed.`,
        });
      } else {
        toast({
          title: "Workflow Failed",
          description: result.errors?.join(', ') || 'Unknown error occurred',
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Workflow execution error:', error);
      toast({
        title: "Execution Error",
        description: error instanceof Error ? error.message : 'Failed to execute workflow',
        variant: "destructive"
      });
    } finally {
      setExecutingWorkflowId(null);
    }
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    console.log('🗑️ SavedWorkflowsTab: Handling delete for workflow:', workflowId);
    
    const workflowToDelete = workflows.find(w => w.id === workflowId);
    if (!workflowToDelete) {
      console.error('❌ Workflow not found for deletion:', workflowId);
      toast({
        title: "Error",
        description: "Workflow not found",
        variant: "destructive"
      });
      return;
    }

    try {
      deleteWorkflow(workflowId);
      
      toast({
        title: "Workflow Deleted",
        description: `"${workflowToDelete.name}" has been removed`,
      });
      
      console.log('✅ Successfully deleted workflow:', workflowToDelete.name);
    } catch (error) {
      console.error('❌ Error deleting workflow:', error);
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive"
      });
    }
  };

  const handleClearAll = () => {
    console.log('🗑️ Clearing all workflows');
    clearAllWorkflows();
    toast({
      title: "All Workflows Cleared",
      description: "All workflows have been removed",
    });
  };

  const handleDebugStorage = () => {
    debugStorage();
    toast({
      title: "Debug Info",
      description: "Check console for localStorage debug information",
    });
  };

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
          <div className="flex gap-2 justify-center">
            <Button onClick={onCreateFirst}>
              Create First Workflow
            </Button>
            <Button variant="outline" size="sm" onClick={handleDebugStorage}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Debug Storage
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Debug Controls */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={handleDebugStorage}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Debug Storage
        </Button>
        {workflows.length > 0 && (
          <Button variant="destructive" size="sm" onClick={handleClearAll}>
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All ({workflows.length})
          </Button>
        )}
      </div>

      {/* Workflows Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workflows.map((workflow) => (
          <WorkflowCard
            key={workflow.id}
            workflow={workflow}
            onEdit={onEditWorkflow}
            onDelete={handleDeleteWorkflow}
            onExecute={handleExecuteWorkflow}
            isExecuting={executingWorkflowId === workflow.id}
          />
        ))}
      </div>

      {/* Status Info */}
      <div className="text-sm text-muted-foreground text-center">
        Showing {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} 
        <span className="ml-2">
          • Browser-specific storage (Chrome ≠ Safari)
        </span>
      </div>
    </div>
  );
};
