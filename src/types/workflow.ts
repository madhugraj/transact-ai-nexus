
// Enhanced workflow step types for the complete pipeline
export type WorkflowStepType = 
  | "data-source"           // Email, Drive, Upload, SAP
  | "document-processing"   // Extract Invoice, Extract PO
  | "Extract Data"          // New step type for extraction
  | "data-validation"       // Validate extracted data
  | "data-comparison"       // Compare PO vs Invoice, JD vs CV
  | "Process Data"          // New step type for processing
  | "data-storage"         // Store in database
  | "database-storage"     // Legacy alias for data-storage
  | "Store Data"           // New step type for storage
  | "analytics"            // Generate analytics
  | "notification"         // Send notifications
  | "conditional"          // Conditional logic
  | "parallel"             // Parallel processing
  | "custom"               // Custom step
  // Legacy types for compatibility
  | "document-source"
  | "comparison"
  | "report-generation"
  | "document_source"
  | "document_comparison"
  | "report_generation"
  | "approval_notification";

// Enhanced step configuration
export interface WorkflowStepConfig {
  // Position for react-flow compatibility
  x?: number;
  y?: number;
  connectedTo?: string[];
  
  // Data source configurations
  emailConfig?: {
    source: 'gmail' | 'outlook';
    filters?: string[];
    attachmentTypes?: string[];
    useIntelligentFiltering?: boolean;
    intelligentRules?: {
      detectInvoices: boolean;
      checkAttachments: boolean;
      aiConfidenceThreshold: number;
    };
  };
  driveConfig?: {
    source: 'google-drive' | 'onedrive';
    folderPath?: string;
    fileTypes?: string[];
    processSubfolders?: boolean;
    nameFilters?: string[];
    dateRange?: {
      enabled: boolean;
      from: string;
      to: string;
    };
  };
  
  // Processing configurations
  processingConfig?: {
    type: 'invoice-extraction' | 'po-extraction' | 'receipt-extraction' | 'contract-extraction' | 'general-ocr';
    aiModel?: 'hybrid' | 'ai-vision' | 'ocr' | 'template-based';
    confidence?: number;
  };
  
  // OCR Settings for extraction
  ocrSettings?: {
    language?: string;
    enhanceResolution?: boolean;
    customPrompt?: string;
  };
  
  // Comparison configurations
  comparisonConfig?: {
    type: 'po-invoice-comparison' | 'jd-cv-comparison' | 'invoice-receipt-comparison' | 'contract-invoice-comparison' | 'multi-document-validation' | 'data-normalization' | 'custom-comparison';
    fields?: string[];
    tolerance?: number;
    matchingCriteria?: 'exact' | 'fuzzy' | 'intelligent';
    sourceTable?: string;
    targetTable?: string;
    useIntelligentMatching?: boolean;
    confidenceThreshold?: number;
    fieldWeights?: Record<string, number>;
    fuzzyMatchSensitivity?: number;
    amountTolerancePercent?: number;
    customBusinessRules?: string[];
  };
  
  // Storage configurations
  storageConfig?: {
    table: string;
    action: 'insert' | 'upsert' | 'update' | 'replace';
    mapping?: Record<string, string>;
    connection?: string;
    validateBeforeInsert?: boolean;
  };
  
  // Database options
  databaseOptions?: {
    createIfNotExists?: boolean;
    connection?: string;
    schema?: Record<string, string>;
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
  processingType?: string; // Added this property to fix the TypeScript error
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

// Alias for compatibility
export type WorkflowExecutionResult = WorkflowExecution;

// Template workflows
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'invoice-processing' | 'po-processing' | 'general' | 'analytics';
  steps: Omit<WorkflowStep, 'id'>[];
  connections: Omit<WorkflowConnection, 'id'>[];
}
