
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, BarChart3, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { WorkflowConfig } from '@/types/workflow';
import WorkflowCard from '@/components/actions/WorkflowCard';
import { useWorkflowPersistence } from '@/hooks/useWorkflowPersistence';
import { useToast } from '@/hooks/use-toast';
import { RealWorkflowEngine } from '@/services/workflow/RealWorkflowEngine';

interface SavedWorkflowsTabProps {
  onCreateFirst: () => void;
  onEditWorkflow?: (workflow: WorkflowConfig) => void;
  isExecuting: boolean;
}

export const SavedWorkflowsTab: React.FC<SavedWorkflowsTabProps> = ({
  onCreateFirst,
  onEditWorkflow,
  isExecuting
}) => {
  const { workflows, loading, deleteWorkflow, clearAllWorkflows, updateWorkflow, refreshWorkflows } = useWorkflowPersistence();
  const { toast } = useToast();
  const workflowEngine = new RealWorkflowEngine();

  const handleExecuteWorkflow = async (workflow: WorkflowConfig) => {
    console.log('🚀 SavedWorkflowsTab: Executing workflow:', workflow.name);
    
    try {
      // Validate workflow requirements first
      const validation = await workflowEngine.validateWorkflowRequirements(workflow);
      
      if (!validation.valid) {
        toast({
          title: "Workflow Cannot Run",
          description: `Please fix these issues: ${validation.errors.join(', ')}`,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Workflow Started",
        description: `Executing ${workflow.name}...`
      });

      // Execute the workflow
      const execution = await workflowEngine.executeWorkflow(workflow);
      
      // Update workflow stats
      updateWorkflow(workflow.id, { 
        lastRun: new Date(), 
        totalRuns: (workflow.totalRuns || 0) + 1,
        successRate: execution.status === 'completed' ? 95 : 85
      });

      if (execution.status === 'completed') {
        toast({
          title: "Workflow Completed",
          description: `${workflow.name} executed successfully!`,
        });
      } else {
        toast({
          title: "Workflow Failed",
          description: execution.errors?.[0] || 'Unknown error occurred',
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Workflow execution error:', error);
      toast({
        title: "Workflow Execution Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
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

    deleteWorkflow(workflowId);
  };

  const handleToggleWorkflow = (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      updateWorkflow(workflowId, { isActive: !workflow.isActive });
      toast({
        title: workflow.isActive ? "Workflow Deactivated" : "Workflow Activated",
        description: `${workflow.name} is now ${workflow.isActive ? 'inactive' : 'active'}`,
      });
    }
  };

  const handleClearAll = () => {
    console.log('🗑️ Clearing all workflows');
    clearAllWorkflows();
  };

  // Show loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading workflows...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            <Button variant="outline" size="sm" onClick={refreshWorkflows}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Controls */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={refreshWorkflows}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
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
            onToggle={handleToggleWorkflow}
          />
        ))}
      </div>

      {/* Status Info */}
      <div className="text-sm text-muted-foreground text-center">
        Showing {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} 
        <span className="ml-2">
          • Stored in your account database
        </span>
      </div>
    </div>
  );
};
