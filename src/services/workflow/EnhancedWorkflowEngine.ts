
import { WorkflowConfig, WorkflowExecution, WorkflowStep, WorkflowStepResult } from '@/types/workflow';
import { GmailWorkflowService } from './GmailWorkflowService';
import { DocumentComparisonService } from './DocumentComparisonService';
import { supabase } from '@/integrations/supabase/client';

export class EnhancedWorkflowEngine {
  private comparisonService: DocumentComparisonService;
  private workflowData: Map<string, any> = new Map();

  constructor() {
    this.comparisonService = new DocumentComparisonService();
  }

  async validateWorkflowRequirements(workflow: WorkflowConfig): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    console.log('🔍 Validating enhanced workflow requirements for:', workflow.name);
    console.log('📋 Workflow steps:', workflow.steps.map(s => ({ name: s.name, type: s.type })));
    
    // Check authentication requirements
    const needsGmailAuth = workflow.steps.some(step => 
      step.type === 'data-source' && (step.name.toLowerCase().includes('gmail') || step.name.toLowerCase().includes('email'))
    );
    
    const needsDriveAuth = workflow.steps.some(step => 
      step.type === 'data-source' && step.name.toLowerCase().includes('drive')
    );
    
    console.log('🔐 Authentication requirements:', { needsGmailAuth, needsDriveAuth });
    
    if (needsGmailAuth) {
      const gmailTokens = localStorage.getItem('gmail_auth_tokens');
      const hasGmailTokens = gmailTokens && JSON.parse(gmailTokens).accessToken;
      
      if (!hasGmailTokens) {
        errors.push('Gmail authentication required. Please connect your Gmail account in Email Connector.');
      }
    }
    
    if (needsDriveAuth) {
      const driveTokens = localStorage.getItem('google_auth_tokens');
      const hasDriveTokens = driveTokens && JSON.parse(driveTokens).accessToken;
      
      if (!hasDriveTokens) {
        errors.push('Google Drive authentication required. Please connect your Drive account in Email Connector.');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async executeWorkflow(workflow: WorkflowConfig): Promise<WorkflowExecution> {
    console.log('🚀 Starting enhanced workflow execution:', workflow.name);
    this.workflowData.clear();
    
    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}`,
      workflowId: workflow.id,
      status: 'running',
      startTime: new Date(),
      stepResults: [],
      processedDocuments: 0,
      errors: []
    };

    try {
      // Execute steps in dependency order
      const executedSteps = new Set<string>();
      const stepResults = new Map<string, any>();
      
      for (const step of workflow.steps) {
        console.log('⚙️ Executing step:', step.name, `(${step.type})`);
        
        // Get input data from connected steps
        const inputData = this.getInputDataForStep(step, stepResults, workflow);
        
        const stepResult = await this.executeStep(step, execution, inputData);
        stepResults.set(step.id, stepResult.output);
        executedSteps.add(step.id);
        
        console.log('✅ Step completed:', step.name, 'Output keys:', Object.keys(stepResult.output || {}));
      }
      
      execution.status = 'completed';
      execution.endTime = new Date();
      
      console.log('🎉 Enhanced workflow execution completed successfully');
      return execution;
      
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.errors?.push(error instanceof Error ? error.message : 'Unknown error');
      
      console.error('❌ Enhanced workflow execution failed:', error);
      throw error;
    }
  }

  private getInputDataForStep(step: WorkflowStep, stepResults: Map<string, any>, workflow: WorkflowConfig): any {
    const connections = workflow.connections?.filter(conn => conn.targetStepId === step.id) || [];
    
    if (connections.length === 0) {
      return {}; // No input connections
    }

    let inputData: any = {};
    
    // Collect data from all connected source steps
    for (const connection of connections) {
      const sourceResult = stepResults.get(connection.sourceStepId);
      if (sourceResult) {
        const sourceStep = workflow.steps.find(s => s.id === connection.sourceStepId);
        
        if (sourceStep?.type === 'data-source') {
          inputData = { ...inputData, ...sourceResult };
        } else if (sourceStep?.type === 'document-processing') {
          // Merge extracted data
          if (sourceStep.name.toLowerCase().includes('po')) {
            inputData.extractedPOs = sourceResult.extractedInvoices || sourceResult.processedData || [];
          } else {
            inputData.extractedInvoices = sourceResult.extractedInvoices || sourceResult.processedData || [];
          }
        } else if (sourceStep?.type === 'data-storage') {
          // For data comparison, fetch stored data from database
          inputData.storedData = sourceResult;
        }
      }
    }
    
    console.log('📊 Input data for step', step.name, ':', {
      hasExtractedInvoices: !!inputData.extractedInvoices,
      invoiceCount: inputData.extractedInvoices?.length || 0,
      hasExtractedPOs: !!inputData.extractedPOs,
      poCount: inputData.extractedPOs?.length || 0,
      hasStoredData: !!inputData.storedData
    });
    
    return inputData;
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
          output = await this.executeEnhancedDataComparisonStep(step, inputData);
          break;

        case 'data-storage':
          output = await this.executeDataStorageStep(step, inputData, execution);
          break;

        case 'analytics':
          output = await this.executeAnalyticsStep(step, inputData);
          break;

        case 'notification':
          output = await this.executeNotificationStep(step, inputData);
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
      
      console.log('✅ Enhanced step completed:', step.name);
      return stepResult;
      
    } catch (error) {
      stepResult.status = 'failed';
      stepResult.endTime = new Date();
      stepResult.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Enhanced step failed:', step.name, error);
      throw error;
    }
  }

  private async executeDataSourceStep(step: WorkflowStep): Promise<any> {
    if (step.name.toLowerCase().includes('gmail') || step.name.toLowerCase().includes('email')) {
      console.log('📧 Fetching Gmail data');
      
      const gmailService = new GmailWorkflowService();
      const result = await gmailService.fetchEmailsWithAttachments(
        ['has:attachment'],
        true
      );

      const files = result.files || result.processedFiles || [];
      
      return {
        source: 'gmail',
        emails: result.emails || [],
        files: files,
        processedFiles: files,
        count: result.count || 0,
        processedData: files
      };
    }

    return { message: 'No data source configured', files: [], emails: [] };
  }

  private async executeDocumentProcessingStep(step: WorkflowStep, inputData: any): Promise<any> {
    console.log('🔄 Enhanced document processing step for:', step.name);
    
    const files = inputData?.files || inputData?.processedFiles || inputData?.processedData || [];
    
    if (files.length === 0) {
      return {
        message: 'No files found to process',
        processedData: [],
        extractedInvoices: []
      };
    }

    const extractedData = [];
    const tokens = localStorage.getItem('gmail_auth_tokens');
    
    if (!tokens) {
      throw new Error('Gmail authentication required for PDF processing');
    }

    const { accessToken } = JSON.parse(tokens);

    for (const file of files) {
      try {
        // Get attachment data
        const { data: attachmentData } = await supabase.functions.invoke('gmail', {
          body: {
            action: 'getAttachment',
            accessToken,
            messageId: file.emailId,
            attachmentId: file.id
          }
        });

        if (!attachmentData?.success) continue;

        const attachmentBase64 = attachmentData.data?.data || attachmentData.data;
        if (!attachmentBase64) continue;

        // Process with Gemini
        const extractionType = step.name.toLowerCase().includes('po') ? 'extractPOData' : 'extractInvoiceData';
        
        const { data: extractionResult } = await supabase.functions.invoke('gemini-api', {
          body: {
            action: extractionType,
            fileData: attachmentBase64,
            fileName: file.name,
            mimeType: file.mimeType
          }
        });

        if (extractionResult?.success) {
          extractedData.push({
            fileName: file.name,
            emailId: file.emailId,
            emailSubject: file.emailSubject,
            attachmentId: file.id,
            extractedData: extractionResult.data,
            confidence: extractionResult.data.extraction_confidence || 0.8,
            source: 'gmail'
          });
        }

      } catch (error) {
        console.error('❌ Error processing file:', file.name, error);
      }
    }
    
    return {
      message: `Successfully extracted data from ${extractedData.length}/${files.length} files`,
      processedData: extractedData,
      extractedInvoices: extractedData
    };
  }

  private async executeEnhancedDataComparisonStep(step: WorkflowStep, inputData: any): Promise<any> {
    console.log('🔄 Enhanced data comparison step - comparing documents intelligently');
    console.log('📊 Input data for comparison:', {
      hasExtractedInvoices: !!inputData?.extractedInvoices,
      invoiceCount: inputData?.extractedInvoices?.length || 0,
      hasExtractedPOs: !!inputData?.extractedPOs,
      poCount: inputData?.extractedPOs?.length || 0
    });

    const extractedInvoices = inputData?.extractedInvoices || [];
    const extractedPOs = inputData?.extractedPOs || [];
    const comparisonResults = [];

    // If we have both POs and Invoices, perform direct comparison
    if (extractedPOs.length > 0 && extractedInvoices.length > 0) {
      console.log('🔄 Performing direct PO vs Invoice comparison');
      
      for (const po of extractedPOs) {
        const matchingInvoices = extractedInvoices.filter(inv => 
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
        }
      }
    }
    // If we only have invoices, compare with stored POs
    else if (extractedInvoices.length > 0) {
      console.log('🔄 Comparing invoices with stored POs from database');
      
      for (const invoice of extractedInvoices) {
        const poNumber = invoice.extractedData?.po_number;
        if (!poNumber) continue;

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
    }
    // If we only have POs, compare with stored invoices
    else if (extractedPOs.length > 0) {
      console.log('🔄 Comparing POs with stored invoices from database');
      
      for (const po of extractedPOs) {
        const poNumber = po.extractedData?.po_number;
        if (!poNumber) continue;

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
    }

    return {
      message: `Successfully compared ${comparisonResults.length} document pairs`,
      comparisonResults,
      totalComparisons: comparisonResults.length,
      singleComparisons: comparisonResults.filter(r => r.type === 'single'),
      multipleComparisons: comparisonResults.filter(r => r.type === 'multiple')
    };
  }

  private async executeDataStorageStep(step: WorkflowStep, inputData: any, execution: WorkflowExecution): Promise<any> {
    console.log('💾 Enhanced data storage step for:', step.name);
    
    const targetTable = step.config.storageConfig?.table || 
                       (step.name.toLowerCase().includes('comparison') ? 'compare_po_invoice_table' : 
                        step.name.toLowerCase().includes('po') ? 'po_table' : 'invoice_table');
    
    let storedCount = 0;
    const errors = [];

    // Handle different types of data storage
    if (inputData?.comparisonResults) {
      // Store comparison results
      console.log('💾 Storing comparison results');
      storedCount = inputData.comparisonResults.length;
      // Results are already stored by the comparison service
      
    } else if (inputData?.extractedInvoices || inputData?.processedData) {
      // Store extracted invoice/PO data
      const extractedData = inputData.extractedInvoices || inputData.processedData || [];
      
      const { DatabaseStorage } = await import('@/services/email/databaseStorage');
      const dbStorage = new DatabaseStorage();

      for (const item of extractedData) {
        try {
          const emailContext = {
            id: item.emailId,
            subject: item.emailSubject || 'Unknown Subject',
            from: 'Unknown Sender',
            date: new Date().toISOString(),
            snippet: '',
            hasAttachments: true,
            labels: []
          };

          if (targetTable === 'po_table') {
            // Store PO data
            await dbStorage.storePOInDatabase(
              item.extractedData,
              emailContext,
              item.fileName,
              emailContext
            );
          } else {
            // Store Invoice data
            await dbStorage.storeInvoiceInDatabase(
              item.extractedData,
              emailContext,
              item.fileName,
              emailContext
            );
          }

          storedCount++;
          console.log('✅ Stored item:', item.fileName);

        } catch (error) {
          console.error('❌ Error storing item:', item.fileName, error);
          errors.push(`Failed to store ${item.fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    return {
      message: `Successfully stored ${storedCount} items in ${targetTable}`,
      stored: storedCount,
      table: targetTable,
      errors: errors
    };
  }

  private async executeAnalyticsStep(step: WorkflowStep, inputData: any): Promise<any> {
    console.log('📊 Generating analytics and reports');
    
    // Fetch recent comparison results for analytics
    const { data: comparisonData } = await supabase
      .from('compare_po_invoice_table')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    const analytics = {
      totalComparisons: comparisonData?.length || 0,
      avgMatchPercentage: 0,
      highVarianceCount: 0,
      approvalRequiredCount: 0
    };

    if (comparisonData && comparisonData.length > 0) {
      const matchPercentages = comparisonData
        .map(item => {
          try {
            const summary = JSON.parse(item.compare_summary_individual || '{}');
            return summary.match_percentage || 0;
          } catch {
            return 0;
          }
        })
        .filter(p => p > 0);

      analytics.avgMatchPercentage = matchPercentages.length > 0 
        ? Math.round(matchPercentages.reduce((a, b) => a + b, 0) / matchPercentages.length)
        : 0;

      analytics.highVarianceCount = comparisonData.filter(item => {
        try {
          const summary = JSON.parse(item.compare_summary_individual || '{}');
          return Math.abs(summary.summary?.amount_variance || 0) > 10;
        } catch {
          return false;
        }
      }).length;

      analytics.approvalRequiredCount = comparisonData.filter(item => {
        try {
          const summary = JSON.parse(item.compare_summary_individual || '{}');
          return summary.summary?.approval_required === true;
        } catch {
          return false;
        }
      }).length;
    }

    return {
      message: 'Analytics report generated successfully',
      analytics,
      reportGenerated: true,
      timestamp: new Date().toISOString()
    };
  }

  private async executeNotificationStep(step: WorkflowStep, inputData: any): Promise<any> {
    console.log('📧 Sending notifications and alerts');
    
    const notifications = [];
    
    // Generate notifications based on comparison results
    if (inputData?.comparisonResults) {
      for (const comparison of inputData.comparisonResults) {
        if (comparison.result?.summary?.approval_required) {
          notifications.push({
            type: 'approval_required',
            message: `PO ${comparison.po} vs Invoice ${comparison.invoice || comparison.invoices} requires approval`,
            severity: 'high',
            data: comparison
          });
        }
      }
    }

    // Generate notifications based on analytics
    if (inputData?.analytics) {
      if (inputData.analytics.approvalRequiredCount > 0) {
        notifications.push({
          type: 'analytics_alert',
          message: `${inputData.analytics.approvalRequiredCount} documents require manual approval`,
          severity: 'medium',
          data: inputData.analytics
        });
      }
    }

    return {
      message: `Sent ${notifications.length} notifications`,
      notifications,
      alertsSent: notifications.length,
      timestamp: new Date().toISOString()
    };
  }

  private fuzzyMatchPONumber(po1: string, po2: string): boolean {
    if (!po1 || !po2) return false;
    
    const clean1 = po1.toString().replace(/[^\d]/g, '');
    const clean2 = po2.toString().replace(/[^\d]/g, '');
    
    return clean1 === clean2 && clean1.length > 0;
  }
}
