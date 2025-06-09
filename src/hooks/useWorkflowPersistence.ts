
import { useState, useEffect } from 'react';
import { WorkflowConfig } from '@/types/workflow';

const WORKFLOWS_STORAGE_KEY = 'saved_workflows';

export function useWorkflowPersistence() {
  const [workflows, setWorkflows] = useState<WorkflowConfig[]>([]);

  // Load workflows from localStorage on mount
  useEffect(() => {
    const savedWorkflows = localStorage.getItem(WORKFLOWS_STORAGE_KEY);
    if (savedWorkflows) {
      try {
        const parsed = JSON.parse(savedWorkflows);
        // Convert date strings back to Date objects
        const workflowsWithDates = parsed.map((workflow: any) => ({
          ...workflow,
          createdAt: new Date(workflow.createdAt),
          lastRun: workflow.lastRun ? new Date(workflow.lastRun) : undefined
        }));
        setWorkflows(workflowsWithDates);
      } catch (error) {
        console.error('Failed to load workflows from localStorage:', error);
      }
    }
  }, []);

  // Save workflows to localStorage whenever workflows change
  useEffect(() => {
    localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(workflows));
  }, [workflows]);

  const addWorkflow = (workflow: WorkflowConfig) => {
    setWorkflows(prev => [...prev, workflow]);
  };

  const updateWorkflow = (id: string, updates: Partial<WorkflowConfig>) => {
    setWorkflows(prev => 
      prev.map(w => w.id === id ? { ...w, ...updates } : w)
    );
  };

  const deleteWorkflow = (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
  };

  return {
    workflows,
    addWorkflow,
    updateWorkflow,
    deleteWorkflow
  };
}
