
import { useState } from 'react';
import { WorkflowConfig } from '@/types/workflow';

export function useCurrentWorkflow() {
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowConfig | null>(null);

  const loadWorkflowInBuilder = (workflow: WorkflowConfig) => {
    setCurrentWorkflow(workflow);
  };

  const clearCurrentWorkflow = () => {
    setCurrentWorkflow(null);
  };

  return {
    currentWorkflow,
    loadWorkflowInBuilder,
    clearCurrentWorkflow,
    hasCurrentWorkflow: currentWorkflow !== null
  };
}
