
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
    
    // Simple validation - check if any step needs authentication
    const needsAuth = workflow.steps.some(step => 
      step.name.toLowerCase().includes('email') || 
      step.name.toLowerCase().includes('gmail') ||
      step.name.toLowerCase().includes('drive')
    );
    
    if (needsAuth) {
      console.log('📧 Workflow requires authentication');
      const hasTokens = this.googleAuthService.hasValidTokens();
      console.log('🔑 Authentication valid:', hasTokens);
      
      if (!hasTokens) {
        errors.push('This workflow requires Gmail/Drive authentication. Please connect your account first.');
      }
    }
    
    console.log('✅ Validation complete. Errors:', errors.length);
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async executeWorkflow(workflow: WorkflowConfig): Promise<WorkflowExecution> {
    // Validate requirements first
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
      
      // Execute all steps in sequence (simplified)
      for (const step of workflow.steps) {
        await this.executeStep(step, execution);
      }
      
      execution.status = 'completed';
      execution.endTime = new Date();
      
      console.log(`✅ Workflow completed: ${workflow.name}`);
      toast({
        title: "Workflow Completed",
        description: `${workflow.name} executed successfully`,
      });

      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.errors?.push(error instanceof Error ? error.message : 'Unknown error');
      
      console.error(`❌ Workflow failed: ${workflow.name}`, error);
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
      
      // Simplified step execution
      let output: any = { message: `Executed ${step.name}`, success: true };
      
      // Simulate processing time
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
