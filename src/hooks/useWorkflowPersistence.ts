import { useState, useEffect } from 'react';
import { WorkflowConfig } from '@/types/workflow';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/UserAuthContext';
import { useToast } from '@/hooks/use-toast';

export function useWorkflowPersistence() {
  const [workflows, setWorkflows] = useState<WorkflowConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  // Load workflows from Supabase when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadWorkflowsFromSupabase();
    } else {
      setWorkflows([]);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadWorkflowsFromSupabase = async () => {
    try {
      setLoading(true);
      console.log('📁 Loading workflows from Supabase for user:', user?.email);
      
      // First check if user is properly authenticated
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !currentUser) {
        console.error('❌ Authentication error:', authError);
        toast({
          title: "Authentication Required",
          description: "Please log in to view your workflows",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      console.log('✅ User authenticated, loading workflows for:', currentUser.email);

      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading workflows:', error);
        
        if (error.code === 'PGRST116') {
          toast({
            title: "Table Not Found",
            description: "Workflows table doesn't exist. Please contact support.",
            variant: "destructive"
          });
        } else if (error.code === '42501') {
          toast({
            title: "Permission Denied", 
            description: "You don't have permission to access workflows. Please check your authentication.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error Loading Workflows",
            description: `Database error: ${error.message}`,
            variant: "destructive"
          });
        }
        setLoading(false);
        return;
      }

      // Convert database format to WorkflowConfig format
      const workflowConfigs: WorkflowConfig[] = (data || []).map(dbWorkflow => ({
        id: dbWorkflow.id,
        name: dbWorkflow.name,
        description: dbWorkflow.description || '',
        steps: dbWorkflow.config?.steps || [],
        connections: dbWorkflow.config?.connections || [],
        isActive: dbWorkflow.is_active,
        createdAt: new Date(dbWorkflow.created_at),
        lastRun: dbWorkflow.last_run ? new Date(dbWorkflow.last_run) : undefined,
        totalRuns: dbWorkflow.total_runs || 0,
        successRate: dbWorkflow.success_rate || 0
      }));

      setWorkflows(workflowConfigs);
      console.log('✅ Successfully loaded', workflowConfigs.length, 'workflows from Supabase');
      
      if (workflowConfigs.length === 0) {
        console.log('📝 No workflows found for user');
      }
    } catch (error) {
      console.error('❌ Failed to load workflows:', error);
      toast({
        title: "Error",
        description: "Failed to load workflows: " + (error instanceof Error ? error.message : 'Unknown error'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addWorkflow = async (workflow: WorkflowConfig) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save workflows",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('➕ Adding new workflow to Supabase:', workflow.name, 'ID:', workflow.id);
      
      // Verify current user authentication
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !currentUser) {
        console.error('❌ User not authenticated for workflow creation');
        toast({
          title: "Authentication Error",
          description: "Please log in again to save workflows",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('workflows')
        .insert({
          id: workflow.id,
          user_id: currentUser.id,
          name: workflow.name,
          description: workflow.description,
          config: {
            steps: workflow.steps,
            connections: workflow.connections
          },
          is_active: workflow.isActive,
          total_runs: workflow.totalRuns || 0,
          success_rate: workflow.successRate || 0
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving workflow:', error);
        toast({
          title: "Error Saving Workflow",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Add to local state
      setWorkflows(prev => [workflow, ...prev]);
      console.log('✅ Successfully saved workflow to Supabase');
      
      toast({
        title: "Workflow Saved",
        description: `"${workflow.name}" has been saved to your account`,
      });
    } catch (error) {
      console.error('❌ Failed to save workflow:', error);
      toast({
        title: "Error",
        description: "Failed to save workflow: " + (error instanceof Error ? error.message : 'Unknown error'),
        variant: "destructive"
      });
    }
  };

  const updateWorkflow = async (id: string, updates: Partial<WorkflowConfig>) => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      console.log('📝 Updating workflow in Supabase:', id, 'Updates:', updates);
      
      // Prepare database updates
      const dbUpdates: any = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.lastRun !== undefined) dbUpdates.last_run = updates.lastRun.toISOString();
      if (updates.totalRuns !== undefined) dbUpdates.total_runs = updates.totalRuns;
      if (updates.successRate !== undefined) dbUpdates.success_rate = updates.successRate;
      
      // If steps or connections are updated, update the config
      if (updates.steps !== undefined || updates.connections !== undefined) {
        const currentWorkflow = workflows.find(w => w.id === id);
        if (currentWorkflow) {
          dbUpdates.config = {
            steps: updates.steps || currentWorkflow.steps,
            connections: updates.connections || currentWorkflow.connections
          };
        }
      }

      const { error } = await supabase
        .from('workflows')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        console.error('❌ Error updating workflow:', error);
        toast({
          title: "Error Updating Workflow",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setWorkflows(prev => 
        prev.map(w => w.id === id ? { ...w, ...updates } : w)
      );
      
      console.log('✅ Successfully updated workflow in Supabase');
    } catch (error) {
      console.error('❌ Failed to update workflow:', error);
      toast({
        title: "Error",
        description: "Failed to update workflow: " + (error instanceof Error ? error.message : 'Unknown error'),
        variant: "destructive"
      });
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      console.log('🗑️ Deleting workflow from Supabase:', id);
      
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting workflow:', error);
        toast({
          title: "Error Deleting Workflow",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Remove from local state
      setWorkflows(prev => prev.filter(w => w.id !== id));
      console.log('✅ Successfully deleted workflow from Supabase');
      
      toast({
        title: "Workflow Deleted",
        description: "Workflow has been removed from your account",
      });
    } catch (error) {
      console.error('❌ Failed to delete workflow:', error);
      toast({
        title: "Error",
        description: "Failed to delete workflow: " + (error instanceof Error ? error.message : 'Unknown error'),
        variant: "destructive"
      });
    }
  };

  const clearAllWorkflows = async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      console.log('🗑️ Clearing all workflows from Supabase');
      
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Error clearing workflows:', error);
        toast({
          title: "Error Clearing Workflows",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setWorkflows([]);
      console.log('✅ Successfully cleared all workflows from Supabase');
      
      toast({
        title: "All Workflows Cleared",
        description: "All workflows have been removed from your account",
      });
    } catch (error) {
      console.error('❌ Failed to clear workflows:', error);
      toast({
        title: "Error",
        description: "Failed to clear workflows: " + (error instanceof Error ? error.message : 'Unknown error'),
        variant: "destructive"
      });
    }
  };

  const refreshWorkflows = () => {
    if (isAuthenticated && user) {
      loadWorkflowsFromSupabase();
    }
  };

  return {
    workflows,
    loading,
    addWorkflow,
    updateWorkflow,
    deleteWorkflow,
    clearAllWorkflows,
    refreshWorkflows
  };
}
