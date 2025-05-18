
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { WorkflowConfig, WorkflowExecutionResult } from '@/types/workflow';

export function useWorkflow() {
  const [workflows, setWorkflows] = useState<WorkflowConfig[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowConfig | null>(null);
  const [executionHistory, setExecutionHistory] = useState<WorkflowExecutionResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();
  
  // Create a new workflow
  const createWorkflow = (workflow: Omit<WorkflowConfig, 'id' | 'createdAt'>) => {
    const newWorkflow: WorkflowConfig = {
      ...workflow,
      id: `workflow-${Date.now()}`,
      createdAt: new Date(),
    };
    
    setWorkflows(prev => [...prev, newWorkflow]);
    
    toast({
      title: 'Workflow Created',
      description: `${newWorkflow.name} has been created successfully.`,
    });
    
    return newWorkflow;
  };
  
  // Update an existing workflow
  const updateWorkflow = (id: string, updates: Partial<WorkflowConfig>) => {
    setWorkflows(prev => 
      prev.map(workflow => 
        workflow.id === id ? { ...workflow, ...updates } : workflow
      )
    );
    
    toast({
      title: 'Workflow Updated',
      description: `Workflow has been updated successfully.`,
    });
  };
  
  // Delete a workflow
  const deleteWorkflow = (id: string) => {
    setWorkflows(prev => prev.filter(workflow => workflow.id !== id));
    
    toast({
      title: 'Workflow Deleted',
      description: `Workflow has been deleted.`,
    });
  };
  
  // Execute a workflow
  const executeWorkflow = async (id: string) => {
    const workflow = workflows.find(w => w.id === id);
    if (!workflow) {
      toast({
        title: 'Error',
        description: 'Workflow not found',
        variant: 'destructive',
      });
      return;
    }
    
    setIsExecuting(true);
    
    // Create a new execution record
    const execution: WorkflowExecutionResult = {
      workflowId: id,
      startTime: new Date(),
      status: 'running',
      stepResults: workflow.steps.map(step => ({
        stepId: step.id,
        startTime: new Date(),
        status: 'pending',
      })),
    };
    
    setExecutionHistory(prev => [...prev, execution]);
    
    // Mock execution with a timeout
    setTimeout(() => {
      // Update the execution record to completed
      setExecutionHistory(prev => 
        prev.map(e => 
          e.workflowId === id && e.startTime === execution.startTime
            ? {
                ...e,
                endTime: new Date(),
                status: 'completed',
                stepResults: e.stepResults.map((sr, index) => ({
                  ...sr,
                  status: 'completed',
                  endTime: new Date(new Date().getTime() + index * 1000),
                })),
              }
            : e
        )
      );
      
      setIsExecuting(false);
      
      // Update the workflow's lastRun
      updateWorkflow(id, { lastRun: new Date() });
      
      toast({
        title: 'Execution Complete',
        description: `${workflow.name} has been executed successfully.`,
      });
    }, 3000);
  };
  
  return {
    workflows,
    currentWorkflow,
    setCurrentWorkflow,
    executionHistory,
    isExecuting,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
  };
}
