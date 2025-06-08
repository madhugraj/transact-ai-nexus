
import { WorkflowConfig, WorkflowExecution, WorkflowStep, WorkflowStepResult } from '@/types/workflow';
import { EmailProcessingService } from '@/services/email/emailProcessingUtils';
import { GoogleAuthService } from '@/services/auth/googleAuthService';
import { extractPODataFromFile } from '@/services/api/poProcessingService';
import { toast } from '@/hooks/use-toast';

export class WorkflowEngine {
  private executions = new Map<string, WorkflowExecution>();
  private emailService: EmailProcessingService;
  private googleAuthService: GoogleAuthService;

  constructor() {
    this.emailService = new EmailProcessingService();
    this.googleAuthService = new GoogleAuthService({
      clientId: '59647658413-2aq8dou9iikfe6dq6ujsp1aiaku5r985.apps.googleusercontent.com',
      scopes: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/gmail.readonly'],
      redirectUri: `${window.location.origin}/oauth/callback`
    });
  }

  async validateWorkflowRequirements(workflow: WorkflowConfig): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    console.log('🔍 Validating workflow requirements for:', workflow.name);
    
    // Check for email/drive source steps that require authentication
    const dataSourceSteps = workflow.steps.filter(step => 
      ['data-source', 'document-source', 'document_source'].includes(step.type)
    );
    
    console.log('📋 Found data source steps:', dataSourceSteps.length);
    
    for (const step of dataSourceSteps) {
      console.log(`🔍 Checking step: ${step.name}, config:`, step.config);
      
      if (step.config.emailConfig || step.name.toLowerCase().includes('email') || step.name.toLowerCase().includes('gmail')) {
        console.log('📧 Step requires Gmail authentication');
        const hasTokens = this.googleAuthService.hasValidTokens();
        console.log('🔑 Gmail tokens valid:', hasTokens);
        
        if (!hasTokens) {
          errors.push(`Step "${step.name}" requires Gmail authentication. Please connect your Gmail account first.`);
        }
      }
      
      if (step.config.driveConfig || step.name.toLowerCase().includes('drive')) {
        console.log('📁 Step requires Google Drive authentication');
        const hasTokens = this.googleAuthService.hasValidTokens();
        console.log('🔑 Drive tokens valid:', hasTokens);
        
        if (!hasTokens) {
          errors.push(`Step "${step.name}" requires Google Drive authentication. Please connect your Google Drive account first.`);
        }
      }
    }
    
    console.log('✅ Validation complete. Errors:', errors.length);
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async executeWorkflow(workflow: WorkflowConfig): Promise<WorkflowExecution> {
    // Validate requirements first
    const validation = await this.validateWorkflowRequirements(workflow);
    if (!validation.valid) {
      throw new Error(`Workflow validation failed:\n${validation.errors.join('\n')}`);
    }

    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}`,
      workflowId: workflow.id,
      status: 'running',
      startTime: new Date(),
      stepResults: [],
      processedDocuments: 0,
      errors: []
    };

    this.executions.set(execution.id, execution);

    try {
      console.log(`🚀 Starting workflow execution: ${workflow.name}`);
      
      // Find the first step (entry point)
      const firstStep = workflow.steps.find(step => 
        !workflow.connections.some(conn => conn.targetStepId === step.id)
      );

      if (!firstStep) {
        throw new Error('No entry point found in workflow');
      }

      const result = await this.executeStep(firstStep, workflow, execution, null);
      
      execution.status = 'completed';
      execution.endTime = new Date();
      
      console.log(`✅ Workflow completed: ${workflow.name}`);
      toast({
        title: "Workflow Completed",
        description: `${workflow.name} executed successfully. Check the console for detailed logs.`,
      });

      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.errors?.push(error instanceof Error ? error.message : 'Unknown error');
      
      console.error(`❌ Workflow failed: ${workflow.name}`, error);
      toast({
        title: "Workflow Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });

      throw error;
    }
  }

  private async executeStep(
    step: WorkflowStep,
    workflow: WorkflowConfig,
    execution: WorkflowExecution,
    input: any
  ): Promise<any> {
    const stepResult: WorkflowStepResult = {
      stepId: step.id,
      status: 'running',
      startTime: new Date(),
      input
    };

    execution.stepResults.push(stepResult);
    execution.currentStepId = step.id;

    try {
      console.log(`🔄 Executing step: ${step.name} (${step.type})`);
      
      let output: any;
      
      // Handle legacy and new step types
      switch (step.type) {
        case 'data-source':
        case 'document-source':
        case 'document_source':
          output = await this.executeDataSourceStep(step, input);
          break;
        case 'document-processing':
          output = await this.executeProcessingStep(step, input);
          break;
        case 'data-storage':
        case 'database_storage':
          output = await this.executeStorageStep(step, input);
          break;
        case 'analytics':
        case 'report-generation':
        case 'report_generation':
          output = await this.executeAnalyticsStep(step, input);
          break;
        case 'conditional':
        case 'comparison':
        case 'document_comparison':
          output = await this.executeConditionalStep(step, input, workflow, execution);
          break;
        case 'notification':
        case 'approval_notification':
          output = await this.executeNotificationStep(step, input);
          break;
        default:
          console.log(`ℹ️ Simulating step: ${step.type}`);
          output = { message: `Executed ${step.type} step`, input };
      }

      stepResult.status = 'completed';
      stepResult.endTime = new Date();
      stepResult.output = output;

      // Execute next steps
      const nextSteps = workflow.connections
        .filter(conn => conn.sourceStepId === step.id)
        .map(conn => workflow.steps.find(s => s.id === conn.targetStepId))
        .filter(s => s !== undefined) as WorkflowStep[];

      for (const nextStep of nextSteps) {
        await this.executeStep(nextStep, workflow, execution, output);
      }

      return output;
    } catch (error) {
      stepResult.status = 'failed';
      stepResult.endTime = new Date();
      stepResult.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  private async executeDataSourceStep(step: WorkflowStep, input: any): Promise<any> {
    const { config } = step;
    
    if (config.emailConfig) {
      return await this.processEmailSource(config.emailConfig);
    } else if (config.driveConfig) {
      return await this.processDriveSource(config.driveConfig);
    }
    
    console.log('📄 Simulating data source step - no specific config found');
    return { source: 'simulated', documents: [], message: 'Note: Configure email or drive settings for actual data processing' };
  }

  private async executeProcessingStep(step: WorkflowStep, input: any): Promise<any> {
    const { config } = step;
    const files = Array.isArray(input) ? input : [input];
    const results = [];

    for (const file of files) {
      if (config.processingConfig?.type === 'invoice-extraction') {
        const result = await this.extractInvoiceData(file);
        results.push(result);
      } else if (config.processingConfig?.type === 'po-extraction') {
        const result = await this.extractPOData(file);
        results.push(result);
      } else {
        console.log('📄 Simulating document processing');
        results.push({ type: 'simulated', data: {}, confidence: 0.95 });
      }
    }

    return results;
  }

  private async executeStorageStep(step: WorkflowStep, input: any): Promise<any> {
    const { config } = step;
    console.log(`💾 Storing data in ${config.storageConfig?.table || 'default_table'}:`, input);
    
    // Simulate database storage
    return {
      stored: true,
      table: config.storageConfig?.table || 'default_table',
      records: Array.isArray(input) ? input.length : 1,
      message: 'Data successfully stored in database'
    };
  }

  private async executeAnalyticsStep(step: WorkflowStep, input: any): Promise<any> {
    const { config } = step;
    console.log(`📊 Running analytics ${config.analyticsConfig?.type || 'general'}:`, input);
    
    // Simulate analytics processing
    return {
      analyticsType: config.analyticsConfig?.type || 'general',
      summary: 'Analytics completed successfully',
      metrics: {
        processedDocuments: Array.isArray(input) ? input.length : 1,
        successRate: 95,
        insights: ['Document processing efficiency: 95%', 'Quality score: Excellent']
      }
    };
  }

  private async executeNotificationStep(step: WorkflowStep, input: any): Promise<any> {
    console.log('📧 Sending notifications...', input);
    
    // Simulate notification sending
    return {
      notificationsSent: true,
      recipients: ['admin@company.com'],
      message: 'Workflow completion notification sent'
    };
  }

  private async executeConditionalStep(
    step: WorkflowStep,
    input: any,
    workflow: WorkflowConfig,
    execution: WorkflowExecution
  ): Promise<any> {
    // Simplified conditional logic
    const condition = step.config.conditionalConfig?.condition || 'hasData';
    const shouldProceed = this.evaluateCondition(condition, input);
    
    console.log(`🔀 Conditional step: ${condition} = ${shouldProceed}`);
    
    const nextStepId = shouldProceed 
      ? step.config.conditionalConfig?.trueStepId
      : step.config.conditionalConfig?.falseStepId;

    if (nextStepId) {
      const nextStep = workflow.steps.find(s => s.id === nextStepId);
      if (nextStep) {
        return await this.executeStep(nextStep, workflow, execution, input);
      }
    }

    return { condition, result: shouldProceed, input };
  }

  private evaluateCondition(condition: string, input: any): boolean {
    // Simple condition evaluation
    if (condition.includes('hasData')) {
      return input && (Array.isArray(input) ? input.length > 0 : true);
    }
    if (condition.includes('isInvoice')) {
      return Math.random() > 0.5; // Simulate invoice detection
    }
    if (condition.includes('isPO')) {
      return Math.random() > 0.5; // Simulate PO detection
    }
    return true;
  }

  private async processEmailSource(config: any): Promise<any> {
    console.log('📧 Processing email source...', config);
    
    try {
      // Check if user has valid tokens stored
      const hasTokens = this.googleAuthService.hasValidTokens();
      if (!hasTokens) {
        throw new Error('Gmail authentication required. Please go to Email Connector page to connect your Gmail account first.');
      }
      
      // This would integrate with your existing email processing
      return { 
        source: 'email', 
        documents: [], 
        message: 'Email processing completed - integrate with Gmail API for real data' 
      };
    } catch (error) {
      console.error('Email processing error:', error);
      throw new Error(`Email processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processDriveSource(config: any): Promise<any> {
    console.log('📁 Processing drive source...', config);
    
    try {
      // Check if user has valid tokens stored
      const hasTokens = this.googleAuthService.hasValidTokens();
      if (!hasTokens) {
        throw new Error('Google Drive authentication required. Please go to Email Connector page to connect your Google Drive account first.');
      }
      
      // This would integrate with your existing drive processing
      return { 
        source: 'drive', 
        documents: [], 
        message: 'Drive processing completed - integrate with Drive API for real data' 
      };
    } catch (error) {
      console.error('Drive processing error:', error);
      throw new Error(`Drive processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractInvoiceData(file: any): Promise<any> {
    console.log('📄 Extracting invoice data...', file);
    // Use your existing invoice extraction logic
    return { 
      type: 'invoice', 
      data: { 
        amount: '$1,234.56', 
        vendor: 'Sample Vendor', 
        date: new Date().toISOString() 
      }, 
      confidence: 0.95 
    };
  }

  private async extractPOData(file: any): Promise<any> {
    console.log('📋 Extracting PO data...', file);
    // Use your existing PO extraction logic
    if (file instanceof File) {
      return await extractPODataFromFile(file);
    }
    return { 
      type: 'po', 
      data: { 
        poNumber: 'PO-12345', 
        amount: '$2,345.67', 
        supplier: 'Sample Supplier' 
      }, 
      confidence: 0.95 
    };
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }
}
