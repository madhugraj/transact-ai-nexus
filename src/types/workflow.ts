
// Enhanced workflow step types for the complete pipeline
export type WorkflowStepType = 
  | "data-source"           // Email, Drive, Upload, SAP
  | "document-processing"   // Extract Invoice, Extract PO
  | "data-validation"       // Validate extracted data
  | "data-storage"         // Store in database
  | "analytics"            // Generate analytics
  | "notification"         // Send notifications
  | "conditional"          // Conditional logic
  | "parallel"             // Parallel processing
  | "custom";              // Custom step

// Enhanced step configuration
export interface WorkflowStepConfig {
  // Data source configurations
  emailConfig?: {
    source: 'gmail' | 'outlook';
    filters?: string[];
    attachmentTypes?: string[];
  };
  driveConfig?: {
    source: 'google-drive' | 'onedrive';
    folderPath?: string;
    fileTypes?: string[];
  };
  
  // Processing configurations
  processingConfig?: {
    type: 'invoice-extraction' | 'po-extraction' | 'general-ocr';
    aiModel?: 'gemini' | 'openai';
    confidence?: number;
  };
  
  // Storage configurations
  storageConfig?: {
    table: string;
    action: 'insert' | 'upsert';
    mapping?: Record<string, string>;
  };
  
  // Analytics configurations
  analyticsConfig?: {
    type: 'comparison' | 'trends' | 'summary';
    parameters?: Record<string, any>;
  };
  
  // Conditional configurations
  conditionalConfig?: {
    condition: string;
    trueStepId?: string;
    falseStepId?: string;
  };
}

// Enhanced workflow step interface
export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  name: string;
  description?: string;
  position: { x: number; y: number };
  config: WorkflowStepConfig;
  nextSteps?: string[];
  isActive?: boolean;
}

// Enhanced workflow interface
export interface WorkflowConfig {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  connections: WorkflowConnection[];
  isActive: boolean;
  schedule?: WorkflowSchedule;
  createdAt: Date;
  lastRun?: Date;
  totalRuns?: number;
  successRate?: number;
}

export interface WorkflowConnection {
  id: string;
  sourceStepId: string;
  targetStepId: string;
  condition?: string;
}

export interface WorkflowSchedule {
  enabled: boolean;
  frequency: 'manual' | 'hourly' | 'daily' | 'weekly';
  time?: string;
  days?: string[];
}

// Execution interfaces
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  startTime: Date;
  endTime?: Date;
  currentStepId?: string;
  stepResults: WorkflowStepResult[];
  metadata?: Record<string, any>;
  processedDocuments?: number;
  errors?: string[];
}

export interface WorkflowStepResult {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime: Date;
  endTime?: Date;
  input?: any;
  output?: any;
  error?: string;
  metadata?: Record<string, any>;
}

// Template workflows
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'invoice-processing' | 'po-processing' | 'general' | 'analytics';
  steps: Omit<WorkflowStep, 'id'>[];
  connections: Omit<WorkflowConnection, 'id'>[];
}
