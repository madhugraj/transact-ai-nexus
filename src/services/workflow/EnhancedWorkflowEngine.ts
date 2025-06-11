
import { WorkflowConfig } from '@/types/workflow';
import { supabase } from '@/integrations/supabase/client';
import { RealWorkflowEngine } from './RealWorkflowEngine';

export class EnhancedWorkflowEngine extends RealWorkflowEngine {
  async validateWorkflowRequirements(workflow: WorkflowConfig): Promise<{ valid: boolean; errors: string[] }> {
    console.log('🔍 Enhanced validation for REAL workflow:', workflow.name);
    
    // First check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ User authentication failed:', authError);
      return { 
        valid: false, 
        errors: ['User must be authenticated to run workflows. Please log in first.'] 
      };
    }
    
    console.log('✅ User authenticated for REAL processing:', user.email);
    
    // Use parent class validation for external auth requirements
    const parentValidation = await super.validateWorkflowRequirements(workflow);
    
    return parentValidation;
  }
}
