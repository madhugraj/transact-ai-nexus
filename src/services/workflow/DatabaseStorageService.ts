
import { supabase } from '@/integrations/supabase/client';

export class DatabaseStorageService {
  async storeData(data: any[], config: any): Promise<any> {
    console.log('💾 Storing data to database with config:', config);
    console.log('📄 Data to store:', data);
    
    // Get current user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User must be authenticated to store data');
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️ No data to store');
      return {
        action: config.action || 'insert',
        table: config.table,
        recordsProcessed: 0,
        recordsStored: 0,
        errors: []
      };
    }

    try {
      const tableName = config.table || 'processed_documents';
      const action = config.action || 'insert';
      
      console.log(`📊 Attempting to ${action} ${data.length} records to table: ${tableName}`);
      
      // Transform data for database storage with user_id
      const dbRecords = data.map(item => ({
        user_id: user.id, // Add user_id for RLS
        file_name: item.fileName || item.name || 'unknown',
        source: item.source || 'workflow',
        type: item.type || 'document',
        data: item,
        processed_at: new Date().toISOString(),
        workflow_id: config.workflowId || null
      }));

      let result;
      
      if (action === 'upsert') {
        result = await supabase
          .from(tableName)
          .upsert(dbRecords, { 
            onConflict: 'file_name,source,user_id',
            ignoreDuplicates: false 
          });
      } else {
        result = await supabase
          .from(tableName)
          .insert(dbRecords);
      }

      if (result.error) {
        console.error('❌ Database storage error:', result.error);
        throw new Error(`Database error: ${result.error.message}`);
      }

      console.log('✅ Successfully stored data to database');
      console.log('📊 Storage result:', result);

      return {
        action,
        table: tableName,
        recordsProcessed: data.length,
        recordsStored: dbRecords.length,
        errors: [],
        result: result.data
      };

    } catch (error) {
      console.error('❌ Error storing data to database:', error);
      
      return {
        action: config.action || 'insert',
        table: config.table,
        recordsProcessed: data.length,
        recordsStored: 0,
        errors: [error instanceof Error ? error.message : 'Unknown storage error'],
        error: error
      };
    }
  }

  async validateTableExists(tableName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.error('❌ Error validating table:', error);
      return false;
    }
  }
}
