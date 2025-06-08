
import { WorkflowConfig, WorkflowExecution, WorkflowStep, WorkflowStepResult } from '@/types/workflow';
import { GoogleAuthService } from '@/services/auth/googleAuthService';
import { toast } from '@/hooks/use-toast';

export class WorkflowEngine {
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
    
    if (needsGmailAuth) {
      console.log('📧 Workflow requires Gmail authentication');
      // Check both storage keys for Gmail tokens
      const gmailTokens = localStorage.getItem('gmail_auth_tokens');
      const hasGmailTokens = gmailTokens && JSON.parse(gmailTokens).accessToken;
      
      if (!hasGmailTokens) {
        errors.push('Gmail authentication required. Please connect your Gmail account.');
      }
    }
    
    if (needsDriveAuth) {
      console.log('📁 Workflow requires Drive authentication');
      const driveTokens = localStorage.getItem('google_auth_tokens');
      const hasDriveTokens = driveTokens && JSON.parse(driveTokens).accessToken;
      
      if (!hasDriveTokens) {
        errors.push('Google Drive authentication required. Please connect your Drive account.');
      }
    }
    
    console.log('✅ Validation complete. Errors:', errors.length);
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async executeWorkflow(workflow: WorkflowConfig): Promise<WorkflowExecution> {
    const validation = await this.validateWorkflowRequirements(workflow);
    if (!validation.valid) {
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

    try {
      console.log(`🚀 Starting workflow execution: ${workflow.name}`);
      
      for (const step of workflow.steps) {
        await this.executeStep(step, execution);
      }
      
      execution.status = 'completed';
      execution.endTime = new Date();
      
      toast({
        title: "Workflow Completed",
        description: `${workflow.name} executed successfully`,
      });

      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.errors?.push(error instanceof Error ? error.message : 'Unknown error');
      
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
      console.log(`🔄 Executing step: ${step.name}`);
      
      let output: any = { message: `Executed ${step.name}`, success: true };
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      stepResult.status = 'completed';
      stepResult.endTime = new Date();
      stepResult.output = output;

      return output;
    } catch (error) {
      stepResult.status = 'failed';
      stepResult.endTime = new Date();
      stepResult.error = error instanceof Error ? error.message : 'Unknown error';
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
