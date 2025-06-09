
import { WorkflowConfig, WorkflowStep, WorkflowExecutionResult } from '@/types/workflow';
import { GmailWorkflowService } from './GmailWorkflowService';
import { DocumentProcessingService } from './DocumentProcessingService';
import { DatabaseStorageService } from './DatabaseStorageService';

export class RealWorkflowEngine {
  private gmailService = new GmailWorkflowService();
  private documentService = new DocumentProcessingService();
  private databaseService = new DatabaseStorageService();

  async validateWorkflowRequirements(workflow: WorkflowConfig): Promise<{ valid: boolean; errors: string[] }> {
    console.log('🔍 Validating workflow requirements for:', workflow.name);
    
    const errors: string[] = [];
    const hasDataSource = workflow.steps.some(step => step.type === 'data-source');
    
    if (!hasDataSource) {
      errors.push('Workflow must include at least one data source step');
    }

    // Check for Gmail authentication if workflow uses Gmail
    const hasGmailStep = workflow.steps.some(step => 
      step.type === 'data-source' && step.config?.emailConfig?.source === 'gmail'
    );
    
    if (hasGmailStep) {
      const tokens = localStorage.getItem('gmail_auth_tokens');
      if (!tokens) {
        errors.push('Gmail authentication required. Please connect your Gmail account in Email Connector.');
      }
    }

    // Check for database storage steps
    const hasStorageStep = workflow.steps.some(step => step.type === 'data-storage');
    if (hasStorageStep) {
      for (const step of workflow.steps.filter(s => s.type === 'data-storage')) {
        if (!step.config?.storageConfig?.table) {
          errors.push(`Storage step "${step.name}" requires a table name`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async executeWorkflow(workflow: WorkflowConfig): Promise<WorkflowExecutionResult> {
    console.log('🚀 Starting real workflow execution:', workflow.name);
    
    const execution: WorkflowExecutionResult = {
      id: `exec-${Date.now()}`,
      workflowId: workflow.id,
      startTime: new Date(),
      status: 'running',
      stepResults: [],
    };

    let stepData: any = null;

    try {
      // Execute each step in sequence
      for (const step of workflow.steps) {
        console.log(`⚙️ Executing step: ${step.name} (${step.type})`);
        
        const stepResult = {
          stepId: step.id,
          startTime: new Date(),
          status: 'running' as const,
          endTime: undefined as Date | undefined,
          output: undefined as any,
          error: undefined as string | undefined,
        };

        try {
          switch (step.type) {
            case 'data-source':
              stepData = await this.executeDataSourceStep(step);
              break;
            case 'document-processing':
              stepData = await this.executeDocumentProcessingStep(step, stepData);
              break;
            case 'data-storage':
              stepData = await this.executeDatabaseStorageStep(step, stepData, workflow.id);
              break;
            default:
              console.log(`⚠️ Skipping unsupported step type: ${step.type}`);
              stepData = { message: `Step type ${step.type} not implemented yet` };
          }

          stepResult.status = 'completed';
          stepResult.endTime = new Date();
          stepResult.output = stepData;
          
          console.log(`✅ Step completed: ${step.name}`);

        } catch (stepError) {
          console.error(`❌ Step failed: ${step.name}`, stepError);
          stepResult.status = 'failed';
          stepResult.endTime = new Date();
          stepResult.error = stepError instanceof Error ? stepError.message : 'Unknown error';
          
          // Continue with next step even if this one fails
        }

        execution.stepResults.push(stepResult);
      }

      execution.status = 'completed';
      execution.endTime = new Date();
      
      console.log('🎉 Workflow execution completed successfully');

    } catch (error) {
      console.error('❌ Workflow execution failed:', error);
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.errors = [error instanceof Error ? error.message : 'Unknown error'];
    }

    return execution;
  }

  private async executeDataSourceStep(step: WorkflowStep): Promise<any> {
    const config = step.config || {};
    
    if (config.emailConfig) {
      console.log('📧 Fetching Gmail data with config:', config.emailConfig);
      const gmailData = await this.gmailService.fetchEmailsWithAttachments(config.emailConfig.filters || []);
      
      if (config.emailConfig.attachmentTypes?.includes('pdf')) {
        const attachments = await this.gmailService.processEmailAttachments(gmailData.emails || []);
        return { ...gmailData, attachments };
      }
      
      return gmailData;
    } else {
      throw new Error('Data source configuration not found');
    }
  }

  private async executeDocumentProcessingStep(step: WorkflowStep, inputData: any): Promise<any> {
    const config = step.config || {};
    
    console.log('🔄 Processing documents with config:', config.processingConfig);
    
    // Extract files/attachments from input data
    const files = inputData?.attachments || inputData?.files || [];
    
    if (files.length === 0) {
      console.log('⚠️ No files to process');
      return { message: 'No files found to process', processedData: [] };
    }
    
    return await this.documentService.processDocuments(files, config.processingConfig?.type || 'general');
  }

  private async executeDatabaseStorageStep(step: WorkflowStep, inputData: any, workflowId: string): Promise<any> {
    const config = step.config || {};
    
    console.log('💾 Storing data with config:', config.storageConfig);
    
    // Extract the processed data
    const dataToStore = inputData?.extractedData || inputData?.processedData || inputData || [];
    
    // Add workflow ID to config for tracking
    const storageConfig = {
      ...config.storageConfig,
      workflowId
    };
    
    return await this.databaseService.storeData(dataToStore, storageConfig);
  }
}
