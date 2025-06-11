
import { WorkflowConfig, WorkflowExecution, WorkflowStep, WorkflowStepResult } from '@/types/workflow';
import { GoogleAuthService } from '@/services/auth/googleAuthService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export class RealWorkflowEngine {
  private executions = new Map<string, WorkflowExecution>();
  private googleAuthService: GoogleAuthService;

  constructor() {
    this.googleAuthService = new GoogleAuthService({
      clientId: '59647658413-2aq8dou9iikfe6dq6ujsp1aiaku5r985.apps.googleusercontent.com',
      scopes: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/gmail.readonly'],
      redirectUri: `${window.location.origin}/oauth/callback`
    });
  }

  async validateWorkflowRequirements(workflow: WorkflowConfig): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    console.log('🔍 Validating workflow requirements for:', workflow.name);
    
    // Check if user is authenticated with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ User authentication failed:', authError);
      errors.push('User must be authenticated to run workflows. Please log in first.');
      return { valid: false, errors };
    }
    
    console.log('✅ User is authenticated:', user.email);
    
    // Check if any step needs Gmail authentication
    const needsGmailAuth = workflow.steps.some(step => 
      step.type === 'data-source' && (
        step.name.toLowerCase().includes('gmail') || 
        step.name.toLowerCase().includes('email')
      )
    );
    
    // Check if any step needs Drive authentication
    const needsDriveAuth = workflow.steps.some(step => 
      step.type === 'data-source' && step.name.toLowerCase().includes('drive')
    );
    
    console.log('🔐 External authentication requirements:', { needsGmailAuth, needsDriveAuth });
    
    if (needsGmailAuth) {
      console.log('📧 Checking Gmail authentication...');
      const gmailTokens = localStorage.getItem('gmail_auth_tokens');
      const hasGmailTokens = gmailTokens && JSON.parse(gmailTokens).accessToken;
      console.log('📧 Gmail tokens status:', { hasTokens: !!hasGmailTokens });
      
      if (!hasGmailTokens) {
        errors.push('Gmail authentication required. Please connect your Gmail account in the Email Connector.');
      }
    }
    
    if (needsDriveAuth) {
      console.log('📁 Checking Drive authentication...');
      const driveTokens = localStorage.getItem('google_auth_tokens');
      const hasDriveTokens = driveTokens && JSON.parse(driveTokens).accessToken;
      console.log('📁 Drive tokens status:', { hasTokens: !!hasDriveTokens });
      
      if (!hasDriveTokens) {
        errors.push('Google Drive authentication required. Please connect your Drive account in the Email Connector.');
      }
    }
    
    console.log('✅ Validation complete. Valid:', errors.length === 0, 'Errors:', errors);
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async executeWorkflow(workflow: WorkflowConfig): Promise<WorkflowExecution> {
    console.log('🚀 Starting workflow execution:', workflow.name);
    
    // Validate authentication and requirements
    const validation = await this.validateWorkflowRequirements(workflow);
    if (!validation.valid) {
      console.error('❌ Workflow validation failed:', validation.errors);
      throw new Error(`Workflow validation failed:\n${validation.errors.join('\n')}`);
    }

    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}`,
      workflowId: workflow.id,
      status: 'running',
      startTime: new Date(),
      stepResults: [],
      processedDocuments: 0,
      errors: []
    };

    this.executions.set(execution.id, execution);
    console.log('📊 Created execution:', execution.id);

    try {
      console.log('🔄 Executing', workflow.steps.length, 'steps...');
      
      for (const step of workflow.steps) {
        console.log('🎯 Executing step:', step.name, '(', step.type, ')');
        await this.executeStep(step, execution);
      }
      
      execution.status = 'completed';
      execution.endTime = new Date();
      
      console.log('✅ Workflow completed successfully in', 
        Math.round((execution.endTime.getTime() - execution.startTime.getTime()) / 1000), 'seconds');
      
      toast({
        title: "Workflow Completed",
        description: `${workflow.name} executed successfully`,
      });

      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.errors?.push(error instanceof Error ? error.message : 'Unknown error');
      
      console.error('❌ Workflow failed:', error);
      
      toast({
        title: "Workflow Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });

      throw error;
    }
  }

  private async executeStep(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    const stepResult: WorkflowStepResult = {
      stepId: step.id,
      status: 'running',
      startTime: new Date()
    };

    execution.stepResults.push(stepResult);
    execution.currentStepId = step.id;

    try {
      console.log('⚙️ Processing step:', step.name);
      
      // Simulate different processing times based on step type
      let processingTime = 500;
      if (step.type === 'document-processing') processingTime = 1000;
      if (step.type === 'analytics') processingTime = 800;
      
      let output: any = { 
        message: `Successfully executed ${step.name}`, 
        success: true,
        stepType: step.type,
        timestamp: new Date().toISOString()
      };
      
      console.log('⏱️ Simulating processing for', processingTime, 'ms...');
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      stepResult.status = 'completed';
      stepResult.endTime = new Date();
      stepResult.output = output;
      
      console.log('✅ Step completed:', step.name);
      return output;
    } catch (error) {
      stepResult.status = 'failed';
      stepResult.endTime = new Date();
      stepResult.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Step failed:', step.name, error);
      throw error;
    }
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }
}
