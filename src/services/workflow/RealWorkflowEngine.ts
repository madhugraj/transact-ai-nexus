import { WorkflowConfig, WorkflowStep, WorkflowExecutionResult } from '@/types/workflow';
import { GmailWorkflowService } from './GmailWorkflowService';
import { DocumentProcessingService } from './DocumentProcessingService';
import { DatabaseStorageService } from './DatabaseStorageService';
import { EmailAttachmentProcessor } from '@/services/email/attachmentProcessor';
import { DatabaseStorage } from '@/services/email/databaseStorage';
import { InvoiceDataExtractionAgent } from '@/services/agents/InvoiceDataExtractionAgent';
import { supabase } from '@/integrations/supabase/client';

export class RealWorkflowEngine {
  private gmailService = new GmailWorkflowService();
  private documentService = new DocumentProcessingService();
  private databaseService = new DatabaseStorageService();
  private emailProcessor = new EmailAttachmentProcessor();
  private dbStorage = new DatabaseStorage();
  private invoiceAgent = new InvoiceDataExtractionAgent();

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

    // Check for Google Drive authentication if workflow uses Google Drive
    const hasDriveStep = workflow.steps.some(step => 
      step.type === 'data-source' && step.config?.driveConfig?.source === 'google-drive'
    );
    
    if (hasDriveStep) {
      const tokens = localStorage.getItem('drive_auth_tokens');
      if (!tokens) {
        errors.push('Google Drive authentication required. Please connect your Google Drive account.');
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
    let poData: any[] = [];
    let invoiceData: any[] = [];

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
              
              // Store data based on source type for comparison
              if (stepData?.source === 'gmail') {
                invoiceData = stepData.extractedData || [];
              } else if (stepData?.source === 'google-drive') {
                poData = stepData.extractedData || [];
              }
              break;
              
            case 'document-processing':
              stepData = await this.executeDocumentProcessingStep(step, stepData);
              break;
              
            case 'data-comparison':
              stepData = await this.executeComparisonStep(step, { poData, invoiceData });
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

  private async executeComparisonStep(step: WorkflowStep, data: { poData: any[], invoiceData: any[] }): Promise<any> {
    console.log('🔄 Executing PO vs Invoice comparison step');
    console.log('📊 PO Data:', data.poData.length, 'records');
    console.log('📊 Invoice Data:', data.invoiceData.length, 'records');
    
    const { poData, invoiceData } = data;
    const comparisonResults = [];
    
    if (poData.length === 0 || invoiceData.length === 0) {
      console.log('⚠️ Insufficient data for comparison');
      return {
        message: 'Insufficient data for comparison',
        comparisonResults: [],
        poCount: poData.length,
        invoiceCount: invoiceData.length
      };
    }
    
    // Compare each PO with each Invoice
    for (const po of poData) {
      for (const invoice of invoiceData) {
        const comparison = this.comparePOAndInvoice(po.data, invoice.data);
        comparisonResults.push({
          poFileName: po.filename,
          invoiceFileName: invoice.filename,
          poNumber: po.data?.po_number,
          invoiceNumber: invoice.data?.invoice_number,
          comparison,
          matchScore: comparison.overallMatch,
          createdAt: new Date().toISOString()
        });
      }
    }
    
    console.log(`✅ Generated ${comparisonResults.length} comparison results`);
    
    return {
      action: 'po_invoice_comparison',
      comparisonResults,
      totalComparisons: comparisonResults.length,
      poCount: poData.length,
      invoiceCount: invoiceData.length
    };
  }

  private comparePOAndInvoice(poData: any, invoiceData: any): any {
    const fields = ['vendor_name', 'total_amount', 'quantity', 'description'];
    const fieldMatches: Record<string, any> = {};
    
    for (const field of fields) {
      const poValue = poData?.[field] || '';
      const invoiceValue = invoiceData?.[field] || '';
      
      fieldMatches[field] = {
        poValue,
        invoiceValue,
        match: this.fuzzyMatch(poValue, invoiceValue),
        exact: poValue === invoiceValue
      };
    }
    
    // Calculate overall match score
    const matchScores = Object.values(fieldMatches).map((match: any) => match.match);
    const overallMatch = matchScores.reduce((a, b) => a + b, 0) / matchScores.length;
    
    return {
      fieldMatches,
      overallMatch: Math.round(overallMatch * 100),
      status: overallMatch > 0.8 ? 'good_match' : overallMatch > 0.5 ? 'partial_match' : 'poor_match'
    };
  }

  private fuzzyMatch(str1: any, str2: any): number {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toString().toLowerCase();
    const s2 = str2.toString().toLowerCase();
    
    if (s1 === s2) return 1;
    
    // Simple fuzzy matching - can be enhanced
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private async executeDataSourceStep(step: WorkflowStep): Promise<any> {
    const config = step.config || {};
    
    // Handle Gmail configuration
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

                      // Process with Invoice Data Extraction Agent
                      console.log(`🤖 Processing ${attachment.filename} with Invoice Data Extraction Agent...`);
                      const extractionResult = await this.invoiceAgent.process(file);
                      
                      if (extractionResult.success && extractionResult.data) {
                        console.log(`✅ Successfully extracted invoice data from ${attachment.filename}:`, extractionResult.data);
                        
                        processedResults.push({
                          email: email,
                          filename: attachment.filename,
                          extractedData: extractionResult.data,
                          success: true,
                          agent: 'invoice-data-extraction',
                          metadata: extractionResult.metadata
                        });
                        
                        extractedDataCount++;
                      } else {
                        console.error(`❌ Failed to extract data from ${attachment.filename}:`, extractionResult.error);
                        processedResults.push({
                          email: email,
                          filename: attachment.filename,
                          extractedData: null,
                          success: false,
                          error: extractionResult.error
                        });
                      }

                    } else {
                      console.error(`❌ Failed to get attachment data for ${attachment.filename}`);
                    }
                  } catch (error) {
                    console.error(`❌ Error processing attachment ${attachment.filename}:`, error);
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
            success: true,
            agent: r.agent,
            metadata: r.metadata
          }))
        };
      }
      
      return gmailData;
    }
    
    // Handle Google Drive configuration
    else if (config.driveConfig) {
      console.log('💿 Fetching Google Drive data with config:', config.driveConfig);
      
      try {
        const tokens = JSON.parse(localStorage.getItem('drive_auth_tokens') || '{}');
        if (!tokens.accessToken) {
          throw new Error('Google Drive access token not found. Please connect your Google Drive account.');
        }

        // Fetch files from Google Drive
        const { data: driveData } = await supabase.functions.invoke('google-drive', {
          body: {
            action: 'list',
            accessToken: tokens.accessToken,
            folderId: config.driveConfig.folderPath || null
          }
        });

        if (!driveData || !driveData.success) {
          throw new Error('Failed to fetch files from Google Drive');
        }

        const files = driveData.data || [];
        console.log(`💿 Found ${files.length} files in Google Drive`);

        // Filter for PDF files if specified
        const pdfFiles = config.driveConfig.fileTypes?.includes('pdf') 
          ? files.filter(f => f.mimeType === 'application/pdf')
          : files;

        console.log(`📄 Processing ${pdfFiles.length} PDF files from Google Drive`);

        const processedResults = [];
        
        // Process each PDF file (limit to first 3)
        for (const file of pdfFiles.slice(0, 3)) {
          try {
            console.log(`📄 Processing file: ${file.name}`);
            
            // Download file content
            const { data: fileData } = await supabase.functions.invoke('google-drive', {
              body: {
                action: 'download',
                accessToken: tokens.accessToken,
                fileId: file.id
              }
            });

            if (fileData) {
              // Convert blob to File object
              const fileObject = new File([fileData], file.name, { type: 'application/pdf' });

              // Process with Invoice Data Extraction Agent
              console.log(`🤖 Processing ${file.name} with Invoice Data Extraction Agent...`);
              const extractionResult = await this.invoiceAgent.process(fileObject);
              
              if (extractionResult.success && extractionResult.data) {
                console.log(`✅ Successfully extracted data from ${file.name}:`, extractionResult.data);
                
                processedResults.push({
                  file: file,
                  filename: file.name,
                  extractedData: extractionResult.data,
                  success: true,
                  agent: 'invoice-data-extraction',
                  metadata: extractionResult.metadata
                });
              } else {
                console.error(`❌ Failed to extract data from ${file.name}:`, extractionResult.error);
                processedResults.push({
                  file: file,
                  filename: file.name,
                  extractedData: null,
                  success: false,
                  error: extractionResult.error
                });
              }

            } else {
              console.error(`❌ Failed to download file: ${file.name}`);
            }
          } catch (error) {
            console.error(`❌ Error processing file ${file.name}:`, error);
          }
        }

        return {
          source: 'google-drive',
          files: pdfFiles,
          processedResults: processedResults,
          totalFiles: pdfFiles.length,
          processedCount: processedResults.length,
          successCount: processedResults.filter(r => r.success).length,
          extractedData: processedResults.filter(r => r.success).map(r => ({
            filename: r.filename,
            data: r.extractedData,
            file: r.file,
            success: true,
            agent: r.agent,
            metadata: r.metadata
          }))
        };

      } catch (error) {
        console.error('❌ Google Drive processing error:', error);
        throw error;
      }
    }
    
    // If no valid configuration found
    else {
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
    
    // Handle comparison results storage
    if (inputData?.action === 'po_invoice_comparison' && inputData.comparisonResults) {
      console.log(`💾 Storing ${inputData.comparisonResults.length} comparison results to po_invoice_compare table`);
      
      try {
        const { data, error } = await supabase
          .from('po_invoice_compare')
          .insert(inputData.comparisonResults.map((result: any) => ({
            po_filename: result.poFileName,
            invoice_filename: result.invoiceFileName,
            po_number: result.poNumber,
            invoice_number: result.invoiceNumber,
            comparison_results: result.comparison,
            match_score: result.matchScore,
            workflow_id: workflowId,
            created_at: result.createdAt
          })))
          .select();

        if (error) {
          throw error;
        }

        console.log('✅ Successfully stored comparison results:', data);
        
        return {
          action: 'comparison_storage',
          table: 'po_invoice_compare',
          recordsStored: data?.length || 0,
          workflowId
        };
      } catch (error) {
        console.error('❌ Error storing comparison results:', error);
        throw error;
      }
    }
    
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
