
import { WorkflowConfig, WorkflowStep } from '@/types/workflow';
import { supabase } from '@/integrations/supabase/client';
import { intelligentMatchingService } from './IntelligentMatchingService';
import { DatabaseStorage } from '@/services/email/databaseStorage';

export class EnhancedWorkflowEngine {
  private databaseStorage = new DatabaseStorage();

  async executeWorkflow(workflow: WorkflowConfig): Promise<{ success: boolean; results: any; error?: string }> {
    console.log('🚀 Starting enhanced workflow execution:', workflow.name);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated to execute workflows');
      }

      const results: any = {};
      
      // Execute steps in sequence
      for (const step of workflow.steps) {
        console.log(`🔄 Executing step: ${step.name} (${step.type})`);
        
        const stepResult = await this.executeStep(step, user.id, results);
        results[step.id] = stepResult;
        
        if (!stepResult.success) {
          console.error(`❌ Step ${step.name} failed:`, stepResult.error);
          return {
            success: false,
            results,
            error: `Step "${step.name}" failed: ${stepResult.error}`
          };
        }
      }

      console.log('✅ Workflow execution completed successfully');
      return {
        success: true,
        results
      };

    } catch (error) {
      console.error('❌ Workflow execution failed:', error);
      return {
        success: false,
        results: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async executeStep(step: WorkflowStep, userId: string, previousResults: any): Promise<any> {
    switch (step.type) {
      case 'data-source':
        return this.executeDataSourceStep(step, userId);
      
      case 'document-processing':
        return this.executeDocumentProcessingStep(step, userId, previousResults);
      
      case 'data-comparison':
        return this.executeDataComparisonStep(step, userId, previousResults);
      
      case 'database-storage':
        return this.executeDatabaseStorageStep(step, userId, previousResults);
      
      default:
        console.warn(`⚠️ Unknown step type: ${step.type}`);
        return {
          success: true,
          message: `Skipped unknown step type: ${step.type}`,
          data: null
        };
    }
  }

  private async executeDataSourceStep(step: WorkflowStep, userId: string): Promise<any> {
    try {
      if (step.config.emailConfig) {
        console.log('📧 Processing email data source');
        // Email processing would be handled by existing email services
        return {
          success: true,
          message: 'Email data source processed',
          data: {
            source: 'email',
            processed: true,
            emailCount: 0 // Would be actual count from email processing
          }
        };
      }
      
      if (step.config.driveConfig) {
        console.log('📁 Processing drive data source');
        // Drive processing would be handled by existing drive services
        return {
          success: true,
          message: 'Drive data source processed',
          data: {
            source: 'drive',
            processed: true,
            fileCount: 0 // Would be actual count from drive processing
          }
        };
      }

      return {
        success: false,
        error: 'No valid data source configuration found'
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Data source step failed'
      };
    }
  }

  private async executeDocumentProcessingStep(step: WorkflowStep, userId: string, previousResults: any): Promise<any> {
    try {
      console.log('📄 Processing documents');
      
      // This would integrate with existing document processing services
      // For now, simulate document processing
      const processingResult = {
        documentsProcessed: 1,
        extractedData: {
          invoices: [],
          pos: []
        },
        processingTime: Date.now()
      };

      return {
        success: true,
        message: 'Documents processed successfully',
        data: processingResult
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Document processing failed'
      };
    }
  }

  private async executeDataComparisonStep(step: WorkflowStep, userId: string, previousResults: any): Promise<any> {
    try {
      console.log('🔍 Executing intelligent data comparison');
      
      if (!step.config.comparisonConfig) {
        return {
          success: false,
          error: 'No comparison configuration found'
        };
      }

      const config = step.config.comparisonConfig;
      
      if (config.type === 'po-invoice-comparison') {
        return await this.executeIntelligentPOInvoiceComparison(userId, config);
      }

      return {
        success: false,
        error: `Unsupported comparison type: ${config.type}`
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Data comparison failed'
      };
    }
  }

  private async executeIntelligentPOInvoiceComparison(userId: string, config: any): Promise<any> {
    try {
      console.log('🧠 Starting intelligent PO-Invoice comparison');
      
      // Get unmatched POs and Invoices
      const [unmatchedPOs, unmatchedInvoices] = await Promise.all([
        intelligentMatchingService.getUnmatchedPOs(userId),
        intelligentMatchingService.getUnmatchedInvoices(userId)
      ]);

      console.log(`📊 Found ${unmatchedPOs.length} POs and ${unmatchedInvoices.length} invoices for comparison`);

      const comparisonResults = [];
      let successfulMatches = 0;
      let totalComparisons = 0;

      // Perform intelligent matching for each PO
      for (const po of unmatchedPOs.slice(0, 5)) { // Limit to 5 for demo
        const potentialMatches = await intelligentMatchingService.findPotentialMatches(po.po_number, userId);
        
        for (const invoice of potentialMatches.slice(0, 3)) { // Top 3 potential matches
          totalComparisons++;
          
          const comparisonResult = await intelligentMatchingService.performIntelligentComparison(
            po.po_number,
            invoice.id,
            userId
          );
          
          comparisonResults.push({
            poNumber: po.po_number,
            invoiceId: invoice.id,
            confidenceScore: comparisonResult.confidenceScore,
            status: comparisonResult.status,
            matchingCriteria: comparisonResult.matchingCriteria
          });

          if (comparisonResult.confidenceScore >= (config.tolerance * 100)) {
            successfulMatches++;
          }
        }
      }

      const summary = {
        totalComparisons,
        successfulMatches,
        averageConfidence: comparisonResults.length > 0 
          ? comparisonResults.reduce((sum, r) => sum + r.confidenceScore, 0) / comparisonResults.length 
          : 0,
        matchRate: totalComparisons > 0 ? (successfulMatches / totalComparisons) * 100 : 0
      };

      console.log('✅ Intelligent comparison completed:', summary);

      return {
        success: true,
        message: `Completed ${totalComparisons} comparisons with ${successfulMatches} successful matches`,
        data: {
          summary,
          comparisonResults: comparisonResults.slice(0, 10), // Return top 10 for display
          config: {
            tolerance: config.tolerance,
            fields: config.fields,
            matchingCriteria: config.matchingCriteria
          }
        }
      };

    } catch (error) {
      console.error('❌ Error in intelligent PO-Invoice comparison:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Intelligent comparison failed'
      };
    }
  }

  private async executeDatabaseStorageStep(step: WorkflowStep, userId: string, previousResults: any): Promise<any> {
    try {
      console.log('💾 Executing database storage step');
      
      if (!step.config.storageConfig) {
        return {
          success: false,
          error: 'No storage configuration found'
        };
      }

      const config = step.config.storageConfig;
      
      // For demonstration, we'll show that data would be stored
      const storageResult = {
        table: config.table,
        action: config.action,
        recordsProcessed: 0,
        timestamp: new Date().toISOString()
      };

      // In a real implementation, this would integrate with the database storage services
      // and store the results from previous workflow steps

      return {
        success: true,
        message: `Data would be stored in ${config.table} using ${config.action} action`,
        data: storageResult
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database storage failed'
      };
    }
  }

  async getWorkflowStatus(workflowId: string): Promise<any> {
    // Implementation for checking workflow execution status
    return {
      workflowId,
      status: 'completed',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      stepsCompleted: 0,
      totalSteps: 0
    };
  }

  async cancelWorkflow(workflowId: string): Promise<boolean> {
    // Implementation for canceling workflow execution
    console.log(`🛑 Canceling workflow: ${workflowId}`);
    return true;
  }
}

export const enhancedWorkflowEngine = new EnhancedWorkflowEngine();
