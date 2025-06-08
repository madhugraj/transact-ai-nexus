
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

  async executeWorkflow(workflow: WorkflowConfig): Promise<WorkflowExecution> {
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
        description: `${workflow.name} executed successfully`,
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
      
      switch (step.type) {
        case 'data-source':
          output = await this.executeDataSourceStep(step, input);
          break;
        case 'document-processing':
          output = await this.executeProcessingStep(step, input);
          break;
        case 'data-storage':
          output = await this.executeStorageStep(step, input);
          break;
        case 'analytics':
          output = await this.executeAnalyticsStep(step, input);
          break;
        case 'conditional':
          output = await this.executeConditionalStep(step, input, workflow, execution);
          break;
        default:
          throw new Error(`Unsupported step type: ${step.type}`);
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
    
    throw new Error('No valid data source configuration');
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
      }
    }

    return results;
  }

  private async executeStorageStep(step: WorkflowStep, input: any): Promise<any> {
    const { config } = step;
    console.log(`💾 Storing data in ${config.storageConfig?.table}:`, input);
    
    // Simulate database storage
    return {
      stored: true,
      table: config.storageConfig?.table,
      records: Array.isArray(input) ? input.length : 1
    };
  }

  private async executeAnalyticsStep(step: WorkflowStep, input: any): Promise<any> {
    const { config } = step;
    console.log(`📊 Running analytics ${config.analyticsConfig?.type}:`, input);
    
    // Simulate analytics processing
    return {
      analyticsType: config.analyticsConfig?.type,
      summary: 'Analytics completed',
      metrics: {
        processedDocuments: Array.isArray(input) ? input.length : 1,
        successRate: 95
      }
    };
  }

  private async executeConditionalStep(
    step: WorkflowStep,
    input: any,
    workflow: WorkflowConfig,
    execution: WorkflowExecution
  ): Promise<any> {
    // Simplified conditional logic
    const condition = step.config.conditionalConfig?.condition || '';
    const shouldProceed = this.evaluateCondition(condition, input);
    
    const nextStepId = shouldProceed 
      ? step.config.conditionalConfig?.trueStepId
      : step.config.conditionalConfig?.falseStepId;

    if (nextStepId) {
      const nextStep = workflow.steps.find(s => s.id === nextStepId);
      if (nextStep) {
        return await this.executeStep(nextStep, workflow, execution, input);
      }
    }

    return input;
  }

  private evaluateCondition(condition: string, input: any): boolean {
    // Simple condition evaluation
    if (condition.includes('hasData')) {
      return input && (Array.isArray(input) ? input.length > 0 : true);
    }
    return true;
  }

  private async processEmailSource(config: any): Promise<any> {
    console.log('📧 Processing email source...');
    // This would integrate with your existing email processing
    return { source: 'email', documents: [] };
  }

  private async processDriveSource(config: any): Promise<any> {
    console.log('📁 Processing drive source...');
    // This would integrate with your existing drive processing
    return { source: 'drive', documents: [] };
  }

  private async extractInvoiceData(file: any): Promise<any> {
    console.log('📄 Extracting invoice data...');
    // Use your existing invoice extraction logic
    return { type: 'invoice', data: {}, confidence: 0.95 };
  }

  private async extractPOData(file: any): Promise<any> {
    console.log('📋 Extracting PO data...');
    // Use your existing PO extraction logic
    if (file instanceof File) {
      return await extractPODataFromFile(file);
    }
    return { type: 'po', data: {}, confidence: 0.95 };
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }
}
