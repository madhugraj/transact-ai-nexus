import { WorkflowConfig, WorkflowExecution, WorkflowStep, WorkflowStepResult } from '@/types/workflow';
import { GmailWorkflowService } from './GmailWorkflowService';
import { DatabaseStorageService } from './DatabaseStorageService';
import { DocumentComparisonService } from './DocumentComparisonService';
import { supabase } from '@/integrations/supabase/client';

export class RealWorkflowEngine {
  private comparisonService: DocumentComparisonService;

  constructor() {
    this.comparisonService = new DocumentComparisonService();
  }

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
      let processedData: any = { files: [], emails: [], extractedInvoices: [], extractedPOs: [] };
      
      for (const step of workflow.steps) {
        console.log('⚙️ Executing step:', step.name, `(${step.type})`);
        const stepResult = await this.executeStep(step, execution, processedData);
        
        // Pass data between steps - ensure proper data flow
        if (stepResult.output) {
          if (step.type === 'data-source') {
            processedData = {
              ...stepResult.output,
              files: stepResult.output.files || stepResult.output.processedFiles || []
            };
            console.log('📊 Data passed to next step:', {
              emailCount: processedData.emails?.length || 0,
              fileCount: processedData.files?.length || 0
            });
          } else if (step.type === 'document-processing') {
            // Determine if this is PO or Invoice processing based on step name
            if (step.name.toLowerCase().includes('po')) {
              processedData = {
                ...processedData,
                extractedPOs: stepResult.output.extractedInvoices || stepResult.output.processedData || []
              };
            } else {
              processedData = {
                ...processedData,
                extractedInvoices: stepResult.output.extractedInvoices || stepResult.output.processedData || []
              };
            }
          } else if (step.type === 'data-comparison') {
            processedData = {
              ...processedData,
              comparisonResults: stepResult.output.comparisonResults || []
            };
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

        case 'data-comparison':
          output = await this.executeDataComparisonStep(step, inputData);
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

      console.log('📧 Gmail result structure:', {
        emails: result.emails?.length || 0,
        files: result.files?.length || 0,
        processedFiles: result.processedFiles?.length || 0
      });

      // Ensure we return the files array properly
      const files = result.files || result.processedFiles || [];
      
      return {
        source: 'gmail',
        emails: result.emails || [],
        files: files,
        processedFiles: files, // Alias for backward compatibility
        count: result.count || 0,
        processedData: files
      };
    }

    return { message: 'No data source configured', files: [], emails: [] };
  }

  private async executeDocumentProcessingStep(step: WorkflowStep, inputData: any): Promise<any> {
    console.log('🔄 Document processing step - extracting invoice data from PDFs');
    console.log('📊 Input data structure:', {
      hasFiles: !!inputData?.files,
      filesLength: inputData?.files?.length || 0,
      hasProcessedData: !!inputData?.processedData,
      processedDataLength: inputData?.processedData?.length || 0,
      inputDataKeys: Object.keys(inputData || {})
    });
    
    // Get files from multiple possible locations in the input data
    const files = inputData?.files || 
                  inputData?.processedFiles || 
                  inputData?.processedData || 
                  [];
    
    console.log('📄 Processing', files.length, 'files for invoice extraction');
    
    if (files.length === 0) {
      console.log('⚠️ No files to process - checking input data structure');
      console.log('📊 Full input data:', inputData);
      return {
        message: 'No files found to process',
        processedData: []
      };
    }

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

        // Ensure we have the correct data format - the attachment data should be base64 string
        const attachmentBase64 = attachmentData.data?.data || attachmentData.data;
        
        if (!attachmentBase64 || typeof attachmentBase64 !== 'string') {
          console.error('❌ Invalid attachment data format for:', file.name);
          continue;
        }

        console.log('📄 Processing attachment data for:', file.name, 'Data length:', attachmentBase64.length);

        // Process the PDF with Gemini for invoice extraction
        const { data: extractionResult, error: extractionError } = await supabase.functions.invoke('gemini-api', {
          body: {
            action: 'extractInvoiceData',
            fileData: attachmentBase64,
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

  private async executeDataComparisonStep(step: WorkflowStep, inputData: any): Promise<any> {
    console.log('🔄 Data comparison step - comparing documents intelligently');
    console.log('📊 Input data for comparison:', {
      hasExtractedInvoices: !!inputData?.extractedInvoices,
      invoiceCount: inputData?.extractedInvoices?.length || 0,
      hasExtractedPOs: !!inputData?.extractedPOs,
      poCount: inputData?.extractedPOs?.length || 0
    });

    const comparisonConfig = step.config.comparisonConfig || {
      type: 'po-invoice-comparison',
      fields: ['po_number', 'vendor', 'line_items', 'total_amount'],
      tolerance: 5,
      matchingCriteria: 'fuzzy'
    };

    const extractedInvoices = inputData?.extractedInvoices || [];
    const extractedPOs = inputData?.extractedPOs || [];

    if (extractedInvoices.length === 0 && extractedPOs.length === 0) {
      console.log('⚠️ No invoices or POs found for comparison');
      return {
        message: 'No documents available for comparison',
        comparisonResults: []
      };
    }

    // If we have both POs and Invoices, perform comparison
    if (extractedPOs.length > 0 && extractedInvoices.length > 0) {
      return await this.performPoInvoiceComparison(extractedPOs, extractedInvoices, comparisonConfig);
    }

    // If we only have invoices or POs from database, fetch the counterparts
    if (extractedInvoices.length > 0) {
      return await this.compareInvoicesWithStoredPOs(extractedInvoices, comparisonConfig);
    }

    if (extractedPOs.length > 0) {
      return await this.comparePOsWithStoredInvoices(extractedPOs, comparisonConfig);
    }

    return {
      message: 'No valid comparison scenario found',
      comparisonResults: []
    };
  }

  private async performPoInvoiceComparison(pos: any[], invoices: any[], config: any): Promise<any> {
    console.log('🔄 Performing PO vs Invoice comparison:', { poCount: pos.length, invoiceCount: invoices.length });
    
    const comparisonResults = [];

    for (const po of pos) {
      const matchingInvoices = invoices.filter(inv => 
        inv.extractedData?.po_number === po.extractedData?.po_number ||
        this.fuzzyMatchPONumber(po.extractedData?.po_number, inv.extractedData?.po_number)
      );

      if (matchingInvoices.length === 1) {
        // Single PO vs Single Invoice
        const result = await this.comparisonService.comparePoWithInvoice(
          po.extractedData, 
          matchingInvoices[0].extractedData
        );
        
        await this.comparisonService.storeComparisonResult(
          'single',
          result,
          po.fileName,
          matchingInvoices[0].fileName
        );

        comparisonResults.push({
          type: 'single',
          po: po.fileName,
          invoice: matchingInvoices[0].fileName,
          result
        });

      } else if (matchingInvoices.length > 1) {
        // Single PO vs Multiple Invoices
        const result = await this.comparisonService.comparePoWithMultipleInvoices(
          po.extractedData, 
          matchingInvoices.map(inv => inv.extractedData)
        );

        await this.comparisonService.storeComparisonResult(
          'multiple',
          result,
          po.fileName,
          matchingInvoices.map(inv => inv.fileName)
        );

        comparisonResults.push({
          type: 'multiple',
          po: po.fileName,
          invoices: matchingInvoices.map(inv => inv.fileName),
          result
        });
      } else {
        console.log('⚠️ No matching invoices found for PO:', po.extractedData?.po_number);
      }
    }

    return {
      message: `Successfully compared ${comparisonResults.length} PO-Invoice pairs`,
      comparisonResults,
      totalComparisons: comparisonResults.length
    };
  }

  private async compareInvoicesWithStoredPOs(invoices: any[], config: any): Promise<any> {
    console.log('🔄 Comparing invoices with stored POs from database');
    
    const comparisonResults = [];

    for (const invoice of invoices) {
      const poNumber = invoice.extractedData?.po_number;
      if (!poNumber) continue;

      // Fetch matching PO from database
      const { data: matchingPOs } = await supabase
        .from('po_table')
        .select('*')
        .eq('po_number', poNumber);

      if (matchingPOs && matchingPOs.length > 0) {
        const result = await this.comparisonService.comparePoWithInvoice(
          matchingPOs[0], 
          invoice.extractedData
        );

        await this.comparisonService.storeComparisonResult(
          'single',
          result,
          matchingPOs[0].file_name,
          invoice.fileName
        );

        comparisonResults.push({
          type: 'single',
          po: matchingPOs[0].file_name,
          invoice: invoice.fileName,
          result
        });
      }
    }

    return {
      message: `Successfully compared ${comparisonResults.length} invoices with stored POs`,
      comparisonResults,
      totalComparisons: comparisonResults.length
    };
  }

  private async comparePOsWithStoredInvoices(pos: any[], config: any): Promise<any> {
    console.log('🔄 Comparing POs with stored invoices from database');
    
    const comparisonResults = [];

    for (const po of pos) {
      const poNumber = po.extractedData?.po_number;
      if (!poNumber) continue;

      // Fetch matching invoices from database
      const { data: matchingInvoices } = await supabase
        .from('invoice_table')
        .select('*')
        .eq('po_number', poNumber);

      if (matchingInvoices && matchingInvoices.length > 0) {
        if (matchingInvoices.length === 1) {
          const result = await this.comparisonService.comparePoWithInvoice(
            po.extractedData, 
            matchingInvoices[0].details
          );

          await this.comparisonService.storeComparisonResult(
            'single',
            result,
            po.fileName,
            matchingInvoices[0].attachment_invoice_name
          );

          comparisonResults.push({
            type: 'single',
            po: po.fileName,
            invoice: matchingInvoices[0].attachment_invoice_name,
            result
          });
        } else {
          const result = await this.comparisonService.comparePoWithMultipleInvoices(
            po.extractedData, 
            matchingInvoices.map(inv => inv.details)
          );

          await this.comparisonService.storeComparisonResult(
            'multiple',
            result,
            po.fileName,
            matchingInvoices.map(inv => inv.attachment_invoice_name)
          );

          comparisonResults.push({
            type: 'multiple',
            po: po.fileName,
            invoices: matchingInvoices.map(inv => inv.attachment_invoice_name),
            result
          });
        }
      }
    }

    return {
      message: `Successfully compared ${comparisonResults.length} POs with stored invoices`,
      comparisonResults,
      totalComparisons: comparisonResults.length
    };
  }

  private fuzzyMatchPONumber(po1: string, po2: string): boolean {
    if (!po1 || !po2) return false;
    
    // Remove common prefixes/suffixes and compare
    const clean1 = po1.toString().replace(/[^\d]/g, '');
    const clean2 = po2.toString().replace(/[^\d]/g, '');
    
    return clean1 === clean2 && clean1.length > 0;
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
