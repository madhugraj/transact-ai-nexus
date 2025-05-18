
export type DocumentSourceType = 'google_drive' | 'email' | 'local' | 'sharepoint' | 'database';

export type ComparisonType = 'po_invoice' | 'invoice_grn' | 'contract_invoice' | 'custom';

export interface WorkflowConfig {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  steps: WorkflowStep[];
  createdAt: Date;
  lastRun?: Date;
  nextRun?: Date;
  triggerType: 'manual' | 'scheduled' | 'event';
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  config: Record<string, any>;
  position: number;
}

export type WorkflowStepType = 
  | 'document_source'
  | 'document_parsing'
  | 'document_comparison'
  | 'report_generation'
  | 'approval_notification'
  | 'database_storage'
  | 'email_notification';

export interface WorkflowExecutionResult {
  workflowId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  stepResults: WorkflowStepResult[];
}

export interface WorkflowStepResult {
  stepId: string;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: any;
  error?: string;
}
