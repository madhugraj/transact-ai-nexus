
import { useState, useEffect } from 'react';
import { WorkflowConfig } from '@/types/workflow';

const WORKFLOWS_STORAGE_KEY = 'saved_workflows';

export function useWorkflowPersistence() {
  const [workflows, setWorkflows] = useState<WorkflowConfig[]>([]);

  // Load workflows from localStorage on mount
  useEffect(() => {
    const savedWorkflows = localStorage.getItem(WORKFLOWS_STORAGE_KEY);
    console.log('📁 Loading workflows from localStorage:', savedWorkflows);
    if (savedWorkflows) {
      try {
        const parsed = JSON.parse(savedWorkflows);
        console.log('📄 Parsed workflows count:', parsed.length);
        // Convert date strings back to Date objects
        const workflowsWithDates = parsed.map((workflow: any) => ({
          ...workflow,
          createdAt: new Date(workflow.createdAt),
          lastRun: workflow.lastRun ? new Date(workflow.lastRun) : undefined
        }));
        setWorkflows(workflowsWithDates);
        console.log('✅ Successfully loaded workflows:', workflowsWithDates.length);
      } catch (error) {
        console.error('❌ Failed to load workflows from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem(WORKFLOWS_STORAGE_KEY);
        setWorkflows([]);
      }
    } else {
      console.log('📭 No workflows found in localStorage');
    }
  }, []);

  // Save workflows to localStorage whenever workflows change
  useEffect(() => {
    console.log('💾 Saving workflows to localStorage. Count:', workflows.length);
    console.log('📋 Workflow IDs being saved:', workflows.map(w => w.id));
    localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(workflows));
  }, [workflows]);

  const addWorkflow = (workflow: WorkflowConfig) => {
    console.log('➕ Adding new workflow:', workflow.name, 'ID:', workflow.id);
    setWorkflows(prev => {
      const newWorkflows = [...prev, workflow];
      console.log('📊 New workflows count after add:', newWorkflows.length);
      return newWorkflows;
    });
  };

  const updateWorkflow = (id: string, updates: Partial<WorkflowConfig>) => {
    console.log('📝 Updating workflow with ID:', id, 'Updates:', updates);
    setWorkflows(prev => {
      const updated = prev.map(w => w.id === id ? { ...w, ...updates } : w);
      console.log('📊 Workflows after update:', updated.length);
      return updated;
    });
  };

  const deleteWorkflow = (id: string) => {
    console.log('🗑️ Attempting to delete workflow with ID:', id);
    console.log('📋 Current workflow IDs:', workflows.map(w => w.id));
    
    setWorkflows(prev => {
      const filteredWorkflows = prev.filter(w => {
        const shouldKeep = w.id !== id;
        console.log(`🔍 Workflow ${w.id} (${w.name}): ${shouldKeep ? 'KEEP' : 'DELETE'}`);
        return shouldKeep;
      });
      
      console.log('📊 Workflows before deletion:', prev.length, 'After deletion:', filteredWorkflows.length);
      console.log('📋 Remaining workflow IDs:', filteredWorkflows.map(w => w.id));
      
      // Force localStorage update immediately
      setTimeout(() => {
        localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(filteredWorkflows));
        console.log('💾 Force saved to localStorage after deletion');
      }, 0);
      
      return filteredWorkflows;
    });
  };

  const clearAllWorkflows = () => {
    console.log('🗑️ Clearing all workflows');
    setWorkflows([]);
    localStorage.removeItem(WORKFLOWS_STORAGE_KEY);
    console.log('✅ All workflows cleared');
  };

  // Debug function to check localStorage directly
  const debugStorage = () => {
    const stored = localStorage.getItem(WORKFLOWS_STORAGE_KEY);
    console.log('🔍 Current localStorage data:', stored);
    console.log('🔍 Current state workflows:', workflows.length);
  };

  return {
    workflows,
    addWorkflow,
    updateWorkflow,
    deleteWorkflow,
    clearAllWorkflows,
    debugStorage
  };
}
