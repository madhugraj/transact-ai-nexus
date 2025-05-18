
// Define workflow step types
export type WorkflowStepType = 
  | "document-source" 
  | "comparison" 
  | "report-generation" 
  | "notification" 
  | "data-storage";

// Define a workflow step interface
export interface WorkflowStep {
  id: string;
  type: WorkflowStepType | string;
  name: string;
  position?: number;
  config: Record<string, any>;
}

// Define workflow interface
export interface WorkflowConfig {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: Date;
  lastRun?: Date;
}

// Define workflow execution result interface
export interface WorkflowStepResult {
  stepId: string;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  stepResults: WorkflowStepResult[];
}
