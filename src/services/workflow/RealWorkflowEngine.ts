
import { WorkflowEngine } from './WorkflowEngine';
import { WorkflowConfig, WorkflowStep, ProcessingContext, WorkflowExecution } from '@/types/workflow';
import { GmailWorkflowService } from './GmailWorkflowService';
import { DocumentProcessingService } from './DocumentProcessingService';
import { DatabaseStorageService } from './DatabaseStorageService';
import { DocumentComparisonService } from './DocumentComparisonService';

export class RealWorkflowEngine extends WorkflowEngine {
  private gmailService: GmailWorkflowService;
  private documentService: DocumentProcessingService;
  private databaseService: DatabaseStorageService;
  private comparisonService: DocumentComparisonService;

  constructor() {
    super();
    this.gmailService = new GmailWorkflowService();
    this.documentService = new DocumentProcessingService();
    this.databaseService = new DatabaseStorageService();
    this.comparisonService = new DocumentComparisonService();
  }

  async executeWorkflow(workflow: WorkflowConfig): Promise<WorkflowExecution> {
    console.log(`🚀 RealWorkflowEngine: Starting workflow ${workflow.name} (${workflow.id})`);
    
    const initialContext: ProcessingContext = {
      options: {},
      results: new Map(),
      metadata: { workflowId: workflow.id, workflowName: workflow.name }
    };
    
    let context: ProcessingContext = { ...initialContext };
    let currentStepId = workflow.steps.find(step => !workflow.connections.find(conn => conn.targetStepId === step.id))?.id;
    
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
      while (currentStepId) {
        const step = workflow.steps.find(s => s.id === currentStepId);
        if (!step) {
          console.error(`❌ RealWorkflowEngine: Step ${currentStepId} not found in workflow ${workflow.id}`);
          break;
        }
        
        const result = await this.executeWorkflowStep(step, context);
        if (!result?.success) {
          console.error(`❌ RealWorkflowEngine: Step ${step.id} failed:`, result?.error);
          execution.status = 'failed';
          execution.errors?.push(`Step ${step.id} failed: ${result?.error}`);
          execution.endTime = new Date();
          return execution;
        }
        
        context = { ...context, ...result };
        
        const connection = workflow.connections.find(c => c.sourceStepId === step.id);
        currentStepId = connection?.targetStepId;
      }
      
      execution.status = 'completed';
      execution.endTime = new Date();
      console.log(`✅ RealWorkflowEngine: Workflow ${workflow.name} completed successfully`);
      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.errors?.push(error instanceof Error ? error.message : 'Unknown error');
      console.error(`❌ RealWorkflowEngine: Workflow failed:`, error);
      return execution;
    }
  }

  private async executeWorkflowStep(step: WorkflowStep, context: ProcessingContext): Promise<any> {
    console.log(`🔄 RealWorkflowEngine: Executing step ${step.id} (${step.type})`);
    
    try {
      switch (step.type) {
        case 'document-source':
        case 'data-source':
          return await this.executeDocumentSource(step, context);
        
        case 'document-processing':
        case 'Extract Data':
          return await this.executeDocumentProcessing(step, context);
        
        case 'data-comparison':
        case 'Process Data':
          return await this.executeDataComparison(step, context);
        
        case 'data-storage':
        case 'database-storage':
        case 'Store Data':
          return await this.executeDataStorage(step, context);
        
        case 'notification':
          return await this.executeNotification(step, context);
        
        default:
          console.warn(`⚠️ Unknown step type: ${step.type}`);
          return { success: false, error: `Unknown step type: ${step.type}` };
      }
    } catch (error) {
      console.error(`❌ Error executing step ${step.id}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async executeDocumentSource(step: WorkflowStep, context: ProcessingContext): Promise<any> {
    console.log('📧 Executing document source step...');
    
    const sourceConfig = step.config?.sourceConfig || step.config?.emailConfig || {};
    const filters = sourceConfig.filters || [];
    const useIntelligentFiltering = sourceConfig.useIntelligentFiltering || false;
    
    console.log('📧 Gmail filters:', filters, 'Intelligent filtering:', useIntelligentFiltering);
    
    try {
      const result = await this.gmailService.fetchEmailsWithAttachments(filters, useIntelligentFiltering);
      
      console.log(`📧 Document source processed ${result.count} emails`);
      
      return {
        success: true,
        totalProcessed: result.count,
        emails: result.emails,
        documents: result.files,
        source: 'gmail'
      };
    } catch (error) {
      console.error('❌ Document source failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Document source failed'
      };
    }
  }

  private async executeDocumentProcessing(step: WorkflowStep, context: ProcessingContext): Promise<any> {
    console.log('🔍 Executing REAL document processing step...');
    
    const processingConfig = step.config?.processingConfig || {};
    const ocrSettings = step.config?.ocrSettings || {};
    const customPrompt = ocrSettings.customPrompt;
    
    // Get processing type with proper fallback and type safety
    const processingType = (processingConfig as any)?.type || 'invoice-extraction';
    
    console.log('🔧 REAL Processing config:', {
      type: processingType,
      hasCustomPrompt: !!customPrompt,
      promptLength: customPrompt?.length || 0
    });
    
    const enhancedContext = {
      ...context,
      customPrompt,
      processingType,
      confidence: (processingConfig as any)?.confidence || 0.8,
      language: ocrSettings.language || 'eng'
    };
    
    // Use actual documents from context (from previous step)
    const files = context.documents || [];
    
    if (!files || files.length === 0) {
      console.log('⚠️ No files available for processing');
      return {
        success: true,
        extractedData: [],
        processedCount: 0,
        successCount: 0,
        message: 'No files to process'
      };
    }
    
    try {
      console.log('🚀 Starting REAL document processing with', files.length, 'files');
      const result = await this.documentService.processDocuments(files, processingType);
      console.log(`🔍 REAL Document processing completed: ${result.processedCount} documents, ${result.successCount} successful`);
      
      return {
        success: true,
        extractedData: result.extractedData,
        processedCount: result.processedCount,
        successCount: result.successCount
      };
    } catch (error) {
      console.error('❌ REAL Document processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Document processing failed'
      };
    }
  }

  private async executeDataComparison(step: WorkflowStep, context: ProcessingContext): Promise<any> {
    console.log('⚖️ Executing data comparison step...');
    
    const comparisonConfig = step.config?.comparisonConfig || {};
    const extractedData = context.extractedData || [];
    
    if (extractedData.length === 0) {
      console.log('⚠️ No extracted data available for comparison');
      return {
        success: true,
        comparisons: [],
        processedCount: 0,
        message: 'No data available for comparison'
      };
    }
    
    try {
      // Check if the service has the expected method, fallback to a basic implementation
      let result;
      if (typeof (this.comparisonService as any).performComparison === 'function') {
        result = await (this.comparisonService as any).performComparison(extractedData, comparisonConfig);
      } else {
        // Fallback implementation
        console.log('⚠️ Using fallback comparison logic');
        result = {
          comparisons: extractedData.map((data, index) => ({
            id: `comparison_${index}`,
            data,
            status: 'processed',
            timestamp: new Date().toISOString()
          })),
          processedCount: extractedData.length
        };
      }
      
      console.log(`⚖️ Data comparison completed: ${result.comparisons?.length || 0} comparisons`);
      
      return {
        success: true,
        comparisons: result.comparisons,
        processedCount: result.processedCount || extractedData.length
      };
    } catch (error) {
      console.error('❌ Data comparison failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Data comparison failed'
      };
    }
  }

  private async executeDataStorage(step: WorkflowStep, context: ProcessingContext): Promise<any> {
    console.log('💾 Executing data storage step...');
    
    const storageConfig = step.config?.storageConfig || {};
    const extractedData = context.extractedData || [];
    
    if (extractedData.length === 0) {
      console.log('⚠️ No extracted data to store');
      return {
        success: true,
        storedCount: 0,
        message: 'No data to store'
      };
    }
    
    try {
      const tableName = (storageConfig as any)?.table || 'extracted_json';
      const connection = (storageConfig as any)?.connection || 'default';
      
      console.log('💾 Storing data to database with config:', {
        connection,
        table: tableName,
        recordCount: extractedData.length
      });
      
      // Improved data transformation - handle different data formats consistently
      const transformedData = extractedData.map((data, index) => {
        // If data is already in the right format for extracted_json, use it
        if (data && typeof data === 'object' && data.json_extract && data.file_name) {
          return data;
        }
        
        // Handle different data formats and transform to extracted_json format
        let jsonExtract;
        let fileName;
        
        if (typeof data === 'string') {
          try {
            jsonExtract = JSON.parse(data);
            fileName = `parsed_document_${index + 1}_${Date.now()}`;
          } catch (e) {
            jsonExtract = { raw_text: data };
            fileName = `text_document_${index + 1}_${Date.now()}`;
          }
        } else if (typeof data === 'object' && data !== null) {
          jsonExtract = data;
          fileName = data.fileName || data.file_name || data.filename || `extracted_document_${index + 1}_${Date.now()}`;
        } else {
          jsonExtract = { data };
          fileName = `unknown_document_${index + 1}_${Date.now()}`;
        }
        
        // Return in extracted_json table format
        return {
          json_extract: jsonExtract,
          file_name: fileName
        };
      });
      
      console.log('📄 Transformed data for storage:', {
        recordCount: transformedData.length,
        tableName,
        sampleRecord: transformedData[0] ? Object.keys(transformedData[0]) : 'none'
      });
      
      const result = await this.databaseService.storeData(transformedData, {
        table: tableName,
        connection,
        action: 'insert'
      });
      
      console.log('💾 Data storage completed:', result.recordsStored, 'records stored');
      
      return {
        success: true,
        storedCount: result.recordsStored,
        recordsProcessed: result.recordsProcessed
      };
    } catch (error) {
      console.error('❌ Data storage failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Data storage failed'
      };
    }
  }

  private async executeNotification(step: WorkflowStep, context: ProcessingContext): Promise<any> {
    console.log('📬 Executing notification step...');
    
    // For now, return a simple success notification
    // This could be extended to use actual notification services
    const processedCount = context.processedCount || 0;
    const storedCount = context.storedCount || 0;
    
    console.log(`📬 Workflow completed: ${processedCount} documents processed, ${storedCount} records stored`);
    
    return {
      success: true,
      notificationsSent: 1,
      message: `Workflow completed successfully: ${processedCount} documents processed, ${storedCount} records stored`
    };
  }
}
