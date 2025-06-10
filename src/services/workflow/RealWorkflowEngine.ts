import { WorkflowConfig, WorkflowExecution, WorkflowStep, WorkflowStepResult } from '@/types/workflow';
import { GmailWorkflowService } from './GmailWorkflowService';
import { DatabaseStorageService } from './DatabaseStorageService';
import { supabase } from '@/integrations/supabase/client';

export class RealWorkflowEngine {
  async validateWorkflowRequirements(workflow: WorkflowConfig): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    console.log('🔍 Validating workflow requirements for:', workflow.name);
    console.log('📋 Workflow steps:', workflow.steps.map(s => ({ name: s.name, type: s.type })));
    
    // Check if any step needs Gmail authentication
    const needsGmailAuth = workflow.steps.some(step => 
      step.type === 'data-source' && step.config.emailConfig?.source === 'gmail'
    );
    
    // Check if any step needs Drive authentication
    const needsDriveAuth = workflow.steps.some(step => 
      step.type === 'data-source' && step.config.driveConfig?.source === 'google-drive'
    );
    
    console.log('🔐 Authentication requirements:', { needsGmailAuth, needsDriveAuth });
    
    if (needsGmailAuth) {
      console.log('📧 Checking Gmail authentication...');
      const gmailTokens = localStorage.getItem('gmail_auth_tokens');
      const hasGmailTokens = gmailTokens && JSON.parse(gmailTokens).accessToken;
      console.log('📧 Gmail tokens status:', { hasTokens: !!hasGmailTokens });
      
      if (!hasGmailTokens) {
        errors.push('Gmail authentication required. Please connect your Gmail account in Email Connector.');
      }
    }
    
    if (needsDriveAuth) {
      console.log('📁 Checking Drive authentication...');
      const driveTokens = localStorage.getItem('google_auth_tokens');
      const hasDriveTokens = driveTokens && JSON.parse(driveTokens).accessToken;
      console.log('📁 Drive tokens status:', { hasTokens: !!hasDriveTokens });
      
      if (!hasDriveTokens) {
        errors.push('Google Drive authentication required. Please connect your Drive account in Email Connector.');
      }
    }
    
    console.log('✅ Validation complete. Valid:', errors.length === 0, 'Errors:', errors);
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async executeWorkflow(workflow: WorkflowConfig): Promise<WorkflowExecution> {
    console.log('🚀 Starting real workflow execution:', workflow.name);
    
    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}`,
      workflowId: `temp-workflow-${Date.now()}`,
      status: 'running',
      startTime: new Date(),
      stepResults: [],
      processedDocuments: 0,
      errors: []
    };

    try {
      let processedData: any = { files: [], emails: [] };
      
      for (const step of workflow.steps) {
        console.log('⚙️ Executing step:', step.name, `(${step.type})`);
        const stepResult = await this.executeStep(step, execution, processedData);
        
        // Pass data between steps
        if (stepResult.output) {
          if (step.type === 'data-source') {
            processedData = stepResult.output;
          }
        }
      }
      
      execution.status = 'completed';
      execution.endTime = new Date();
      
      console.log('🎉 Workflow execution completed successfully');
      return execution;
      
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.errors?.push(error instanceof Error ? error.message : 'Unknown error');
      
      console.error('❌ Workflow execution failed:', error);
      throw error;
    }
  }

  private async executeStep(step: WorkflowStep, execution: WorkflowExecution, inputData: any): Promise<WorkflowStepResult> {
    const stepResult: WorkflowStepResult = {
      stepId: step.id,
      status: 'running',
      startTime: new Date(),
      input: inputData
    };

    execution.stepResults.push(stepResult);
    execution.currentStepId = step.id;

    try {
      let output: any = null;

      switch (step.type) {
        case 'data-source':
          output = await this.executeDataSourceStep(step);
          break;

        case 'document-processing':
          output = await this.executeDocumentProcessingStep(step, inputData);
          break;

        case 'data-storage':
          output = await this.executeDataStorageStep(step, inputData, execution);
          break;

        default:
          console.log('⚠️ Unknown step type, using default execution');
          await new Promise(resolve => setTimeout(resolve, 500));
          output = { 
            message: `Successfully executed ${step.name}`, 
            success: true,
            stepType: step.type,
            timestamp: new Date().toISOString()
          };
      }

      stepResult.status = 'completed';
      stepResult.endTime = new Date();
      stepResult.output = output;
      
      console.log('✅ Step completed:', step.name);
      return stepResult;
      
    } catch (error) {
      stepResult.status = 'failed';
      stepResult.endTime = new Date();
      stepResult.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Step failed:', step.name, error);
      throw error;
    }
  }

  private async executeDataSourceStep(step: WorkflowStep): Promise<any> {
    if (step.config.emailConfig) {
      console.log('📧 Fetching Gmail data with config:', step.config.emailConfig);
      
      const gmailService = new GmailWorkflowService();
      const result = await gmailService.fetchEmailsWithAttachments(
        step.config.emailConfig.filters || [],
        step.config.emailConfig.useIntelligentFiltering || false
      );

      // Process attachments from emails
      const processedFiles = await gmailService.processEmailAttachments(result.emails);
      
      return {
        source: 'gmail',
        emails: result.emails,
        files: processedFiles,
        count: result.count,
        processedData: processedFiles
      };
    }

    return { message: 'No data source configured', files: [], emails: [] };
  }

  private async executeDocumentProcessingStep(step: WorkflowStep, inputData: any): Promise<any> {
    console.log('🔄 Document processing step - extracting invoice data from PDFs');
    
    const files = inputData?.files || inputData?.processedData || [];
    
    if (files.length === 0) {
      console.log('⚠️ No files to process');
      return {
        message: 'No files found to process',
        processedData: []
      };
    }

    console.log('📄 Processing', files.length, 'PDF files for invoice extraction');
    
    const extractedInvoices = [];
    const tokens = localStorage.getItem('gmail_auth_tokens');
    
    if (!tokens) {
      console.error('❌ No Gmail tokens available for PDF processing');
      return {
        message: 'Gmail authentication required for PDF processing',
        processedData: []
      };
    }

    const { accessToken } = JSON.parse(tokens);

    for (const file of files) {
      try {
        console.log('📄 Extracting data from:', file.name);
        
        // Get the attachment data from Gmail
        const { data: attachmentData, error } = await supabase.functions.invoke('gmail', {
          body: {
            action: 'getAttachment',
            accessToken,
            messageId: file.emailId,
            attachmentId: file.id
          }
        });

        if (error || !attachmentData?.success) {
          console.error('❌ Failed to get attachment:', file.name, error || attachmentData?.error);
          continue;
        }

        // Process the PDF with Gemini for invoice extraction
        const { data: extractionResult, error: extractionError } = await supabase.functions.invoke('gemini-api', {
          body: {
            action: 'extractInvoiceData',
            fileData: attachmentData.data,
            fileName: file.name,
            mimeType: file.mimeType
          }
        });

        if (extractionError || !extractionResult?.success) {
          console.error('❌ Failed to extract data from:', file.name, extractionError || extractionResult?.error);
          continue;
        }

        const extractedData = extractionResult.data;
        console.log('✅ Extracted invoice data from:', file.name);

        extractedInvoices.push({
          fileName: file.name,
          emailId: file.emailId,
          emailSubject: file.emailSubject,
          attachmentId: file.id,
          extractedData: extractedData,
          confidence: extractedData.extraction_confidence || 0.8,
          source: 'gmail'
        });

      } catch (error) {
        console.error('❌ Error processing file:', file.name, error);
      }
    }
    
    console.log('✅ Invoice extraction completed:', extractedInvoices.length, 'invoices processed');
    
    return {
      message: `Successfully extracted data from ${extractedInvoices.length}/${files.length} files`,
      processedData: extractedInvoices,
      extractedInvoices: extractedInvoices
    };
  }

  private async executeDataStorageStep(step: WorkflowStep, inputData: any, execution: WorkflowExecution): Promise<any> {
    console.log('💾 Storing extracted invoice data with config:', step.config.storageConfig);
    console.log('📄 Input data for storage:', inputData);
    
    if (!step.config.storageConfig) {
      throw new Error('No storage configuration found');
    }

    // Get the extracted invoice data
    const extractedInvoices = inputData?.extractedInvoices || inputData?.processedData || [];
    
    if (extractedInvoices.length === 0) {
      console.log('⚠️ No extracted invoice data to store');
      return {
        message: 'No invoice data to store',
        stored: 0
      };
    }

    console.log('💾 Storing', extractedInvoices.length, 'extracted invoices to database');

    let storedCount = 0;
    const errors = [];

    // Import the database storage service for invoice processing
    const { DatabaseStorage } = await import('@/services/email/databaseStorage');
    const dbStorage = new DatabaseStorage();

    for (const invoice of extractedInvoices) {
      try {
        // Create a proper email context object that matches GmailMessage interface
        const emailContext = {
          id: invoice.emailId,
          subject: invoice.emailSubject || 'Unknown Subject',
          from: 'Unknown Sender',
          date: new Date().toISOString(),
          snippet: '',
          hasAttachments: true,
          labels: []
        };

        await dbStorage.storeInvoiceInDatabase(
          invoice.extractedData,
          emailContext,
          invoice.fileName,
          emailContext
        );

        storedCount++;
        console.log('✅ Stored invoice:', invoice.fileName);

      } catch (error) {
        console.error('❌ Error storing invoice:', invoice.fileName, error);
        errors.push(`Failed to store ${invoice.fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      message: `Successfully stored ${storedCount}/${extractedInvoices.length} invoices`,
      stored: storedCount,
      total: extractedInvoices.length,
      errors: errors,
      table: step.config.storageConfig.table
    };
  }
}
