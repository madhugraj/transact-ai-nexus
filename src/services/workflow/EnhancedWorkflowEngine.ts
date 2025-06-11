
import { WorkflowConfig } from '@/types/workflow';
import { supabase } from '@/integrations/supabase/client';
import { RealWorkflowEngine } from './RealWorkflowEngine';

export class EnhancedWorkflowEngine extends RealWorkflowEngine {
  async validateWorkflowRequirements(workflow: WorkflowConfig): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    console.log('🔍 Enhanced validation for workflow:', workflow.name);
    
    // First check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ User authentication failed:', authError);
      errors.push('User must be authenticated to run workflows. Please log in first.');
      return { valid: false, errors };
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Use parent class validation for external auth requirements
    const parentValidation = await super.validateWorkflowRequirements(workflow);
    
    // Combine any additional errors
    errors.push(...parentValidation.errors);
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
