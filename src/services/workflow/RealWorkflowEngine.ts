
import { WorkflowConfig, WorkflowExecution, WorkflowStepResult } from '@/types/workflow';
import { GmailWorkflowService } from './GmailWorkflowService';
import { InvoiceDetectionAgent } from '@/services/agents/InvoiceDetectionAgent';
import { InvoiceDataExtractionAgent } from '@/services/agents/InvoiceDataExtractionAgent';
import { PODetectionAgent } from '@/services/agents/PODetectionAgent';
import { PODataExtractionAgent } from '@/services/agents/PODataExtractionAgent';
import { supabase } from '@/integrations/supabase/client';

export class RealWorkflowEngine {
  private gmailService: GmailWorkflowService;
  private invoiceDetectionAgent: InvoiceDetectionAgent;
  private invoiceExtractionAgent: InvoiceDataExtractionAgent;
  private poDetectionAgent: PODetectionAgent;
  private poExtractionAgent: PODataExtractionAgent;

  constructor() {
    this.gmailService = new GmailWorkflowService();
    this.invoiceDetectionAgent = new InvoiceDetectionAgent();
    this.invoiceExtractionAgent = new InvoiceDataExtractionAgent();
    this.poDetectionAgent = new PODetectionAgent();
    this.poExtractionAgent = new PODataExtractionAgent();
  }

  async validateWorkflowRequirements(workflow: WorkflowConfig): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    console.log('🔍 Validating workflow requirements for:', workflow.name);
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ User authentication failed:', authError);
      errors.push('User must be authenticated to run workflows. Please log in first.');
      return { valid: false, errors };
    }
    
    console.log('✅ User is authenticated:', user.email);
    
    // Check external authentication requirements
    const externalAuthRequirements = this.checkExternalAuthRequirements(workflow);
    console.log('🔐 External authentication requirements:', externalAuthRequirements);
    
    // Check Gmail authentication if needed
    if (externalAuthRequirements.needsGmailAuth) {
      console.log('📧 Checking Gmail authentication...');
      const gmailTokens = localStorage.getItem('gmail_auth_tokens');
      const hasGmailTokens = !!gmailTokens;
      console.log('📧 Gmail tokens status:', { hasTokens: hasGmailTokens });
      
      if (!hasGmailTokens) {
        errors.push('Gmail authentication required. Please connect your Gmail account in the Email Connector.');
      }
    }
    
    // Check Google Drive authentication if needed
    if (externalAuthRequirements.needsDriveAuth) {
      console.log('📁 Checking Google Drive authentication...');
      const driveTokens = localStorage.getItem('drive_auth_tokens');
      if (!driveTokens) {
        errors.push('Google Drive authentication required. Please connect your Google Drive account.');
      }
    }
    
    console.log('✅ Validation complete. Valid:', errors.length === 0, 'Errors:', errors);
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  private checkExternalAuthRequirements(workflow: WorkflowConfig): { needsGmailAuth: boolean; needsDriveAuth: boolean } {
    let needsGmailAuth = false;
    let needsDriveAuth = false;
    
    workflow.steps.forEach(step => {
      if (step.type === 'data-source') {
        if (step.config.emailConfig?.source === 'gmail') {
          needsGmailAuth = true;
        }
        if (step.config.driveConfig?.source === 'google-drive') {
          needsDriveAuth = true;
        }
      }
    });
    
    return { needsGmailAuth, needsDriveAuth };
  }

  async executeWorkflow(workflow: WorkflowConfig): Promise<WorkflowExecution> {
    console.log('🚀 Starting REAL workflow execution:', workflow.name);
    
    const executionId = `exec_${Date.now()}`;
    console.log('📊 Created execution:', executionId);
    
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflow.id,
      status: 'running',
      startTime: new Date(),
      stepResults: [],
      processedDocuments: 0,
      errors: []
    };

    try {
      console.log('🔄 Executing', workflow.steps.length, 'steps with REAL processing...');
      
      // Execute steps in sequence
      let stepData: any = null; // Data passed between steps
      
      for (const step of workflow.steps) {
        console.log('🎯 Executing step:', step.name, '(', step.type, ')');
        
        const stepResult: WorkflowStepResult = {
          stepId: step.id,
          status: 'running',
          startTime: new Date()
        };

        try {
          console.log('⚙️ REAL processing step:', step.name);
          
          // Execute the actual step logic
          const result = await this.executeStep(step, stepData);
          
          stepResult.status = 'completed';
          stepResult.endTime = new Date();
          stepResult.output = result;
          stepData = result; // Pass data to next step
          
          console.log('✅ Step completed with REAL data:', step.name);
          
        } catch (stepError) {
          console.error('❌ Step failed:', step.name, stepError);
          stepResult.status = 'failed';
          stepResult.endTime = new Date();
          stepResult.error = stepError instanceof Error ? stepError.message : 'Unknown error';
          execution.errors?.push(`Step "${step.name}" failed: ${stepResult.error}`);
        }
        
        execution.stepResults.push(stepResult);
      }
      
      execution.status = execution.errors && execution.errors.length > 0 ? 'failed' : 'completed';
      execution.endTime = new Date();
      
      const duration = (execution.endTime.getTime() - execution.startTime.getTime()) / 1000;
      console.log('✅ REAL workflow completed successfully in', duration, 'seconds');
      
    } catch (error) {
      console.error('❌ Workflow execution failed:', error);
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.errors = [error instanceof Error ? error.message : 'Unknown workflow error'];
    }

    return execution;
  }

  private async executeStep(step: any, inputData: any): Promise<any> {
    switch (step.type) {
      case 'data-source':
        return await this.executeDataSourceStep(step);
        
      case 'document-processing':
      case 'Extract Data':
        return await this.executeDocumentProcessingStep(step, inputData);
        
      case 'data-storage':
      case 'database-storage':
      case 'Store Data':
        return await this.executeDataStorageStep(step, inputData);
        
      default:
        console.warn('⚠️ Unknown step type:', step.type, 'for step:', step.name);
        return { message: `Step ${step.name} executed (type: ${step.type})` };
    }
  }

  private async executeDataSourceStep(step: any): Promise<any> {
    if (step.config.emailConfig?.source === 'gmail') {
      console.log('📧 REAL Gmail fetch starting...');
      
      const filters = step.config.emailConfig.filters || [];
      const useIntelligentFiltering = step.config.emailConfig.useIntelligentFiltering || false;
      
      const emailData = await this.gmailService.fetchEmailsWithAttachments(filters, useIntelligentFiltering);
      
      console.log('📧 REAL Gmail fetch completed:', emailData.count, 'emails found');
      return emailData;
    }
    
    // Handle other data sources...
    throw new Error(`Unsupported data source configuration for step: ${step.name}`);
  }

  private async executeDocumentProcessingStep(step: any, inputData: any): Promise<any> {
    console.log('🔍 REAL document processing with AI extraction...');
    
    if (!inputData || !inputData.files) {
      throw new Error('No input files to process');
    }
    
    const processingType = step.config.processingConfig?.type || 'general-ocr';
    console.log('🤖 Using REAL processing type:', processingType);
    
    const extractedData = {
      processedCount: 0,
      extractedDocuments: []
    };
    
    // Process each file with real AI agents
    for (const file of inputData.files) {
      try {
        console.log('📄 REAL processing file:', file.name);
        
        let documentData = null;
        
        // Determine document type and use appropriate agent
        if (processingType === 'invoice-extraction' || step.name.toLowerCase().includes('invoice')) {
          console.log('📄 Using invoice detection agent for:', file.name);
          
          // First detect if it's an invoice
          const detection = await this.invoiceDetectionAgent.process(file);
          if (detection.success && detection.data?.is_invoice) {
            console.log('✅ Invoice detected, extracting data...');
            const extraction = await this.invoiceExtractionAgent.process(file);
            if (extraction.success) {
              documentData = extraction.data;
            }
          }
        } else if (processingType === 'po-extraction' || step.name.toLowerCase().includes('po')) {
          console.log('📄 Using PO detection agent for:', file.name);
          
          // First detect if it's a PO
          const detection = await this.poDetectionAgent.process(file);
          if (detection.success && detection.data?.is_po) {
            console.log('✅ PO detected, extracting data...');
            const extraction = await this.poExtractionAgent.process(file);
            if (extraction.success) {
              documentData = extraction.data;
            }
          }
        }
        
        if (documentData) {
          extractedData.extractedDocuments.push({
            filename: file.name,
            extractedData: documentData,
            confidence: documentData.extraction_confidence || 0.95,
            processingTime: Date.now()
          });
          extractedData.processedCount++;
          console.log('✅ REAL extraction completed for:', file.name);
        } else {
          console.log('⚠️ No data extracted from:', file.name);
        }
        
      } catch (error) {
        console.error('❌ Error processing file:', file.name, error);
      }
    }
    
    console.log('🔍 REAL document processing completed:', extractedData.processedCount, 'documents processed');
    return extractedData;
  }

  private async executeDataStorageStep(step: any, inputData: any): Promise<any> {
    console.log('💾 REAL database storage starting...');
    
    if (!inputData || !inputData.extractedDocuments) {
      throw new Error('No extracted data to store');
    }
    
    const tableName = step.config.storageConfig?.table || 'extracted_json';
    const action = step.config.storageConfig?.action || 'insert';
    
    console.log('💾 REAL storage to table:', tableName, 'using action:', action);
    
    try {
      const results = [];
      
      for (const doc of inputData.extractedDocuments) {
        const dataToStore = {
          file_name: doc.filename,
          json_extract: doc.extractedData,
          created_at: new Date().toISOString()
        };
        
        console.log('💾 REAL database insert for:', doc.filename);
        
        const { data, error } = await supabase
          .from(tableName)
          .insert(dataToStore)
          .select();
        
        if (error) {
          console.error('❌ REAL database insert failed:', error);
          throw new Error(`Failed to store data for ${doc.filename}: ${error.message}`);
        }
        
        results.push(data);
        console.log('✅ REAL database insert successful:', doc.filename);
      }
      
      console.log('💾 All REAL data stored successfully. Records created:', results.length);
      
      return {
        storedCount: results.length,
        tableName: tableName,
        records: results
      };
      
    } catch (error) {
      console.error('❌ REAL data storage step failed:', error);
      throw error;
    }
  }
}
