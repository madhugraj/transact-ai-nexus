
import { WorkflowConfig, WorkflowStep, WorkflowExecutionResult } from '@/types/workflow';
import { GmailWorkflowService } from './GmailWorkflowService';
import { DocumentProcessingService } from './DocumentProcessingService';
import { DatabaseStorageService } from './DatabaseStorageService';
import { EmailAttachmentProcessor } from '@/services/email/attachmentProcessor';
import { DatabaseStorage } from '@/services/email/databaseStorage';
import { supabase } from '@/integrations/supabase/client';

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
        
        // Step 2: Get detailed email data with attachments using Gmail API
        const emails = gmailData.emails || [];
        const processedResults = [];
        let extractedDataCount = 0;

        for (const email of emails.slice(0, 3)) { // Process first 3 emails
          console.log(`📧 Processing email: ${email.subject}`);
          
          try {
            // Get full email details including attachments
            const { data: emailDetails } = await supabase.functions.invoke('gmail', {
              body: {
                action: 'get',
                accessToken: JSON.parse(localStorage.getItem('gmail_auth_tokens') || '{}').accessToken,
                messageId: email.id
              }
            });

            if (emailDetails && emailDetails.success && emailDetails.data) {
              const fullEmail = emailDetails.data;
              const attachments = this.extractAttachments(fullEmail);
              
              console.log(`📎 Found ${attachments.length} attachments in email: ${email.subject}`);

              // Process each PDF attachment
              for (const attachment of attachments) {
                if (attachment.mimeType === 'application/pdf') {
                  console.log(`📄 Processing PDF: ${attachment.filename}`);
                  
                  try {
                    // Get attachment data
                    const { data: attachmentData } = await supabase.functions.invoke('gmail', {
                      body: {
                        action: 'attachment',
                        accessToken: JSON.parse(localStorage.getItem('gmail_auth_tokens') || '{}').accessToken,
                        messageId: email.id,
                        attachmentId: attachment.attachmentId
                      }
                    });

                    if (attachmentData && attachmentData.success) {
                      // Properly handle base64 data from Gmail API
                      let base64Data = attachmentData.data.data;
                      
                      // Convert URL-safe base64 to regular base64
                      base64Data = base64Data.replace(/-/g, '+').replace(/_/g, '/');
                      
                      // Add padding if needed
                      while (base64Data.length % 4) {
                        base64Data += '=';
                      }
                      
                      console.log(`🔧 Cleaned base64 data length: ${base64Data.length}`);
                      
                      // Convert base64 to blob and create file
                      const binaryData = atob(base64Data);
                      const bytes = new Uint8Array(binaryData.length);
                      for (let i = 0; i < binaryData.length; i++) {
                        bytes[i] = binaryData.charCodeAt(i);
                      }
                      const blob = new Blob([bytes], { type: 'application/pdf' });
                      const file = new File([blob], attachment.filename, { type: 'application/pdf' });

                      console.log(`✅ Created file: ${file.name}, size: ${file.size} bytes`);

                      // Process with Gemini
                      console.log(`🤖 Processing ${attachment.filename} with Gemini...`);
                      const { classifyDocument } = await import('@/components/document-comparison/upload/DocumentClassifier');
                      
                      const extractedData = await classifyDocument(file);
                      console.log(`✅ Extracted data from ${attachment.filename}:`, extractedData);
                      
                      processedResults.push({
                        email: email,
                        filename: attachment.filename,
                        extractedData: extractedData,
                        success: true
                      });
                      
                      extractedDataCount++;

                    } else {
                      console.error(`❌ Failed to get attachment data for ${attachment.filename}`);
                    }
                  } catch (error) {
                    console.error(`❌ Error processing attachment ${attachment.filename}:`, error);
                    console.error('Error details:', {
                      name: error.name,
                      message: error.message,
                      stack: error.stack
                    });
                  }
                }
              }
            }
          } catch (error) {
            console.error(`❌ Error getting email details for ${email.subject}:`, error);
          }
        }
        
        console.log(`✅ Processed ${processedResults.length} attachments, extracted ${extractedDataCount} documents`);
        
        // Return structured data for the next steps
        return {
          source: 'gmail',
          emails: emails,
          processedResults: processedResults,
          totalEmails: emails.length,
          processedCount: processedResults.length,
          successCount: processedResults.filter(r => r.success).length,
          extractedData: processedResults.filter(r => r.success).map(r => ({
            filename: r.filename,
            data: r.extractedData,
            email: r.email,
            success: true
          }))
        };
      }
      
      return gmailData;
    } else {
      throw new Error('Data source configuration not found');
    }
  }

  private extractAttachments(emailData: any): any[] {
    const attachments: any[] = [];
    
    const extractFromParts = (parts: any[]) => {
      for (const part of parts) {
        if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size,
            attachmentId: part.body.attachmentId
          });
        }
        
        if (part.parts) {
          extractFromParts(part.parts);
        }
      }
    };
    
    if (emailData.payload?.parts) {
      extractFromParts(emailData.payload.parts);
    }
    
    return attachments;
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
            console.log(`💾 Storing invoice data for ${extractedItem.filename}`);
            
            await this.dbStorage.storeInvoiceInDatabase(
              extractedItem.data,
              extractedItem.email,
              extractedItem.filename,
              { source: 'workflow', workflowId }
            );
            
            storedCount++;
            console.log(`✅ Successfully stored ${extractedItem.filename} to database`);
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
