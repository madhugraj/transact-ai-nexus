import { WorkflowEngine } from './WorkflowEngine';
import { WorkflowConfig, WorkflowStep, ProcessingContext } from '@/types/workflow';
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

  async executeWorkflow(workflow: WorkflowConfig, initialContext: ProcessingContext): Promise<any> {
    console.log(`🚀 RealWorkflowEngine: Starting workflow ${workflow.name} (${workflow.id})`);
    
    let context: ProcessingContext = { ...initialContext };
    let currentStepId = workflow.steps.find(step => !workflow.connections.find(conn => conn.targetStepId === step.id))?.id;
    
    while (currentStepId) {
      const step = workflow.steps.find(s => s.id === currentStepId);
      if (!step) {
        console.error(`❌ RealWorkflowEngine: Step ${currentStepId} not found in workflow ${workflow.id}`);
        break;
      }
      
      const result = await this.executeStep(step, context);
      if (!result?.success) {
        console.error(`❌ RealWorkflowEngine: Step ${step.id} failed:`, result?.error);
        return { success: false, error: `Step ${step.id} failed: ${result?.error}` };
      }
      
      context = { ...context, ...result };
      
      const connection = workflow.connections.find(c => c.sourceStepId === step.id);
      currentStepId = connection?.targetStepId;
    }
    
    console.log(`✅ RealWorkflowEngine: Workflow ${workflow.name} completed successfully`);
    return { success: true, context };
  }

  private async executeStep(step: WorkflowStep, context: ProcessingContext): Promise<any> {
    console.log(`🔄 RealWorkflowEngine: Executing step ${step.id} (${step.type})`);
    
    try {
      switch (step.type) {
        case 'document-source':
          return await this.executeDocumentSource(step, context);
        
        case 'document-processing':
          return await this.executeDocumentProcessing(step, context);
        
        case 'data-comparison':
          return await this.executeDataComparison(step, context);
        
        case 'data-storage':
          return await this.executeDataStorage(step, context);
        
        case 'notification':
          return await this.executeNotification(step, context);
        
        default:
          console.warn(`⚠️ Unknown step type: ${step.type}`);
          return { success: false, error: `Unknown step type: ${step.type}` };
      }
    } catch (error) {
      console.error(`❌ Error executing step ${step.id}:`, error);
      return { success: false, error: error.message };
    }
  }

  private async executeDocumentSource(step: WorkflowStep, context: ProcessingContext): Promise<any> {
    console.log('📧 Executing document source step...');
    
    // Extract source configuration
    const sourceConfig = step.config.sourceConfig || {};
    const gmailFilters = sourceConfig.gmailFilters || {};
    
    // Pass filters to Gmail service
    const result = await this.gmailService.processEmails({
      ...gmailFilters,
      limit: sourceConfig.limit || 50,
      includeAttachments: true
    });
    
    console.log(`📧 Document source processed ${result.totalProcessed} emails`);
    return result;
  }

  private async executeDocumentProcessing(step: WorkflowStep, context: ProcessingContext): Promise<any> {
    console.log('🔍 Executing document processing step...');
    
    // Extract processing configuration and custom prompt
    const processingConfig = step.config.processingConfig || {};
    const ocrSettings = step.config.ocrSettings || {};
    const customPrompt = ocrSettings.customPrompt;
    
    console.log('🔧 Processing config:', {
      type: processingConfig.type,
      hasCustomPrompt: !!customPrompt,
      promptLength: customPrompt?.length || 0
    });
    
    // Enhanced context with custom prompt
    const enhancedContext = {
      ...context,
      customPrompt,
      processingType: processingConfig.type || 'invoice-extraction',
      confidence: processingConfig.confidence || 0.8,
      language: ocrSettings.language || 'eng'
    };
    
    const result = await this.documentService.processDocuments(enhancedContext);
    console.log(`🔍 Document processing completed: ${result.processedCount} documents`);
    return result;
  }

  private async executeDataComparison(step: WorkflowStep, context: ProcessingContext): Promise<any> {
    console.log('⚖️ Executing data comparison step...');
    
    const comparisonConfig = step.config.comparisonConfig || {};
    const result = await this.comparisonService.compareDocuments(context);
    
    console.log(`⚖️ Data comparison completed: ${result.comparisons?.length || 0} comparisons`);
    return result;
  }

  private async executeDataStorage(step: WorkflowStep, context: ProcessingContext): Promise<any> {
    console.log('💾 Executing data storage step...');
    
    const storageConfig = step.config.storageConfig || {};
    const result = await this.databaseService.storeProcessedData(context);
    
    console.log(`💾 Data storage completed: ${result.storedCount} records`);
    return result;
  }

  private async executeNotification(step: WorkflowStep, context: ProcessingContext): Promise<any> {
    console.log('📬 Executing notification step...');
    
    // Mock notification for now
    return {
      success: true,
      notificationsSent: 1,
      recipients: ['user@example.com']
    };
  }
}
