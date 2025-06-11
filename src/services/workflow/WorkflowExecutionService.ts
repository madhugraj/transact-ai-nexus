
import { supabase } from '@/integrations/supabase/client';
import { WorkflowExecution } from '@/types/workflow';

export class WorkflowExecutionService {
  async saveExecution(execution: WorkflowExecution): Promise<void> {
    try {
      console.log('💾 Saving workflow execution:', execution.id);
      
      // First, try to save to workflow_executions table
      const { data, error } = await supabase
        .from('workflow_executions')
        .insert({
          id: execution.id,
          workflow_id: execution.workflowId,
          status: execution.status,
          start_time: execution.startTime.toISOString(),
          end_time: execution.endTime?.toISOString(),
          step_results: execution.stepResults,
          processed_documents: execution.processedDocuments || 0,
          errors: execution.errors || []
        })
        .select();
      
      if (error) {
        console.error('❌ Failed to save to workflow_executions, trying workflows table:', error);
        
        // Fallback: Update the workflows table with last run info
        const { error: updateError } = await supabase
          .from('workflows')
          .update({
            last_run: execution.endTime?.toISOString() || new Date().toISOString(),
            total_runs: supabase.sql`total_runs + 1`
          })
          .eq('id', execution.workflowId);
        
        if (updateError) {
          console.error('❌ Failed to update workflows table:', updateError);
        } else {
          console.log('✅ Updated workflows table with execution info');
        }
      } else {
        console.log('✅ Workflow execution saved successfully');
      }
    } catch (error) {
      console.error('❌ Error in saveExecution:', error);
    }
  }

  async getExecutions(workflowId: string): Promise<WorkflowExecution[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('start_time', { ascending: false });
      
      if (error) {
        console.error('❌ Failed to fetch executions:', error);
        return [];
      }
      
      return (data || []).map(row => ({
        id: row.id,
        workflowId: row.workflow_id,
        status: row.status,
        startTime: new Date(row.start_time),
        endTime: row.end_time ? new Date(row.end_time) : undefined,
        stepResults: row.step_results || [],
        processedDocuments: row.processed_documents || 0,
        errors: row.errors || []
      }));
    } catch (error) {
      console.error('❌ Error fetching executions:', error);
      return [];
    }
  }
}
