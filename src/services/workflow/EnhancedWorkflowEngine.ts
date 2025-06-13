
import { WorkflowConfig, WorkflowExecution } from '@/types/workflow';
import { supabase } from '@/integrations/supabase/client';
import { RealWorkflowEngine } from './RealWorkflowEngine';
import { WorkflowExecutionService } from './WorkflowExecutionService';

export class EnhancedWorkflowEngine extends RealWorkflowEngine {
  private executionService: WorkflowExecutionService;

  constructor() {
    super();
    this.executionService = new WorkflowExecutionService();
  }

  async validateWorkflowRequirements(workflow: WorkflowConfig): Promise<{ valid: boolean; errors: string[] }> {
    console.log('🔍 Enhanced validation for workflow:', workflow.name);
    const errors: string[] = [];
    
    try {
      // First check user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ User authentication failed:', authError);
        errors.push('User must be authenticated to run workflows. Please log in first.');
        return { valid: false, errors };
      }
      
      console.log('✅ User authenticated:', user.email);
      
      // Check for Gmail/Drive steps and validate tokens
      const hasGmailStep = workflow.steps.some(step => 
        step.type === 'document-source' || step.type === 'data-source'
      );
      
      if (hasGmailStep) {
        const gmailTokens = localStorage.getItem('gmail_auth_tokens');
        const driveTokens = localStorage.getItem('drive_auth_tokens');
        
        if (!gmailTokens && !driveTokens) {
          errors.push('Gmail or Google Drive connection required. Please connect your account first.');
        } else {
          // Validate token expiry
          try {
            if (gmailTokens) {
              const tokens = JSON.parse(gmailTokens);
              if (!tokens.accessToken) {
                errors.push('Gmail authentication is incomplete. Please reconnect your Gmail account.');
              } else if (tokens.expiresAt && Date.now() >= tokens.expiresAt) {
                errors.push('Gmail authentication has expired. Please reconnect your Gmail account.');
              }
            }
            
            if (driveTokens) {
              const tokens = JSON.parse(driveTokens);
              if (!tokens.accessToken) {
                errors.push('Google Drive authentication is incomplete. Please reconnect your Google Drive account.');
              } else if (tokens.timestamp && (Date.now() - tokens.timestamp) > 24 * 60 * 60 * 1000) {
                errors.push('Google Drive authentication has expired. Please reconnect your Google Drive account.');
              }
            }
          } catch (tokenError) {
            console.error('❌ Error validating tokens:', tokenError);
            errors.push('Authentication tokens are corrupted. Please reconnect your accounts.');
          }
        }
      }
      
      // Validate workflow structure
      if (!workflow.steps || workflow.steps.length === 0) {
        errors.push('Workflow must have at least one step.');
      }
      
      if (!workflow.connections || workflow.connections.length === 0) {
        if (workflow.steps.length > 1) {
          errors.push('Multi-step workflows must have connections between steps.');
        }
      }
      
      // Check for orphaned steps
      const connectedSteps = new Set<string>();
      workflow.connections.forEach(conn => {
        connectedSteps.add(conn.sourceStepId);
        connectedSteps.add(conn.targetStepId);
      });
      
      const orphanedSteps = workflow.steps.filter(step => 
        workflow.steps.length > 1 && !connectedSteps.has(step.id)
      );
      
      if (orphanedSteps.length > 0) {
        errors.push(`Found ${orphanedSteps.length} disconnected steps. All steps must be connected in the workflow.`);
      }
      
      console.log('🔍 Validation complete:', { 
        valid: errors.length === 0, 
        errorCount: errors.length 
      });
      
      return { valid: errors.length === 0, errors };
      
    } catch (error) {
      console.error('❌ Validation error:', error);
      errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, errors };
    }
  }

  async executeWorkflow(workflow: WorkflowConfig): Promise<WorkflowExecution> {
    console.log('🚀 Enhanced workflow execution starting...');
    
    // Validate before execution
    const validation = await this.validateWorkflowRequirements(workflow);
    if (!validation.valid) {
      const execution: WorkflowExecution = {
        id: `exec_${Date.now()}`,
        workflowId: workflow.id,
        status: 'failed',
        startTime: new Date(),
        endTime: new Date(),
        stepResults: [],
        processedDocuments: 0,
        errors: validation.errors
      };
      
      await this.executionService.saveExecution(execution);
      return execution;
    }
    
    const execution = await super.executeWorkflow(workflow);
    
    // Save the execution using the service
    await this.executionService.saveExecution(execution);
    
    return execution;
  }
}
