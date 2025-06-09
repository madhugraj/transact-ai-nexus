
import { WorkflowConfig, WorkflowStep, WorkflowExecutionResult } from '@/types/workflow';
import { GmailWorkflowService } from './GmailWorkflowService';
import { DocumentProcessingService } from './DocumentProcessingService';
import { DatabaseStorageService } from './DatabaseStorageService';
import { EmailAttachmentProcessor } from '@/services/email/attachmentProcessor';
import { DatabaseStorage } from '@/services/email/databaseStorage';

export class RealWorkflowEngine {
  private gmailService = new GmailWorkflowService();
  private documentService = new DocumentProcessingService();
  private databaseService = new DatabaseStorageService();
  private emailProcessor = new EmailAttachmentProcessor();
  private dbStorage = new DatabaseStorage();

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
          status: 'running' as 'pending' | 'running' | 'completed' | 'failed' | 'skipped',
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
      
      // Step 1: Fetch emails with attachments
      const gmailData = await this.gmailService.fetchEmailsWithAttachments(config.emailConfig.filters || []);
      console.log('📧 Gmail data fetched:', gmailData);
      
      if (config.emailConfig.attachmentTypes?.includes('pdf')) {
        console.log('📎 Processing email attachments...');
        
        // Step 2: Process attachments using the tested email processor
        const emails = gmailData.emails || [];
        const processedResults = {
          source: 'gmail',
          emails: [],
          attachments: [],
          invoiceValidation: [],
          extractedData: [],
          processedCount: 0,
          successCount: 0
        };

        for (const email of emails.slice(0, 5)) { // Process first 5 emails
          console.log(`📧 Processing email: ${email.subject}`);
          
          if (email.attachments && email.attachments.length > 0) {
            for (const attachment of email.attachments) {
              if (attachment.mimeType === 'application/pdf') {
                console.log(`📎 Processing PDF attachment: ${attachment.filename}`);
                
                try {
                  // Create a mock file object for processing
                  const mockFile = new File([], attachment.filename, { type: attachment.mimeType });
                  const attachmentData = {
                    file: mockFile,
                    filename: attachment.filename,
                    mimeType: attachment.mimeType,
                    size: attachment.size
                  };

                  const emailContext = {
                    subject: email.subject,
                    from: email.from,
                    date: email.date
                  };

                  // Use the tested email attachment processor
                  const processed = await this.emailProcessor.processAttachment(
                    attachmentData,
                    email,
                    emailContext,
                    processedResults
                  );

                  if (processed) {
                    processedResults.successCount++;
                  }
                  processedResults.processedCount++;

                } catch (error) {
                  console.error(`❌ Error processing attachment ${attachment.filename}:`, error);
                }
              }
            }
          }
        }
        
        console.log(`✅ Processed ${processedResults.processedCount} attachments, ${processedResults.successCount} successful`);
        return processedResults;
      }
      
      return gmailData;
    } else {
      throw new Error('Data source configuration not found');
    }
  }

  private async executeDocumentProcessingStep(step: WorkflowStep, inputData: any): Promise<any> {
    console.log('🔄 Document processing step - data already processed in data source step');
    
    // Document processing was already done in the data source step for emails
    if (inputData?.extractedData && inputData.extractedData.length > 0) {
      console.log(`📊 Found ${inputData.extractedData.length} extracted documents`);
      return inputData;
    }
    
    // For other data sources, use the document service
    const config = step.config || {};
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
    console.log('📄 Input data for storage:', inputData);
    
    // Handle extracted invoice data from email processing
    if (inputData?.extractedData && inputData.extractedData.length > 0) {
      console.log(`💾 Storing ${inputData.extractedData.length} extracted invoices to database`);
      
      let storedCount = 0;
      const errors: string[] = [];
      
      for (const extractedItem of inputData.extractedData) {
        if (extractedItem.success && extractedItem.data) {
          try {
            // Find corresponding email for context
            const email = inputData.emails?.find((e: any) => 
              e.attachments?.some((a: any) => a.filename === extractedItem.filename)
            );
            
            if (email) {
              console.log(`💾 Storing invoice data for ${extractedItem.filename}`);
              
              await this.dbStorage.storeInvoiceInDatabase(
                extractedItem.data,
                email,
                extractedItem.filename,
                { source: 'workflow', workflowId }
              );
              
              storedCount++;
              console.log(`✅ Successfully stored ${extractedItem.filename} to database`);
            } else {
              console.log(`⚠️ No email context found for ${extractedItem.filename}`);
            }
          } catch (error) {
            console.error(`❌ Error storing ${extractedItem.filename}:`, error);
            errors.push(`Failed to store ${extractedItem.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }
      
      return {
        action: 'invoice_storage',
        table: 'invoice_table',
        recordsProcessed: inputData.extractedData.length,
        recordsStored: storedCount,
        errors,
        workflowId
      };
    }
    
    // Fallback to generic database storage
    const dataToStore = inputData?.processedData || inputData || [];
    const storageConfig = {
      ...config.storageConfig,
      workflowId
    };
    
    return await this.databaseService.storeData(dataToStore, storageConfig);
  }
}
