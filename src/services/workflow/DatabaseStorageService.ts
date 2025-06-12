
import { supabase } from '@/integrations/supabase/client';

export class DatabaseStorageService {
  async storeData(data: any[], config: any = {}): Promise<{ recordsStored: number; recordsProcessed: number }> {
    console.log('📊 DatabaseStorageService: Storing data', {
      recordCount: data.length,
      table: config.table,
      action: config.action
    });
    
    if (!data || data.length === 0) {
      console.log('⚠️ No data to store');
      return { recordsStored: 0, recordsProcessed: 0 };
    }
    
    const tableName = config.table || 'extracted_json';
    const action = config.action || 'insert';
    
    try {
      // Validate data before insertion
      const validData = data.filter(record => {
        if (!record || typeof record !== 'object') {
          console.warn('⚠️ Skipping invalid record:', record);
          return false;
        }
        return true;
      });
      
      if (validData.length === 0) {
        console.warn('⚠️ No valid data to store after filtering');
        return { recordsStored: 0, recordsProcessed: data.length };
      }
      
      console.log('📄 Attempting to insert', validData.length, 'valid records to table:', tableName);
      
      // Insert data into the specified table
      const { data: insertedData, error } = await supabase
        .from(tableName)
        .insert(validData)
        .select();
      
      if (error) {
        console.error('❌ Database insertion error:', error);
        
        // If the specified table doesn't exist or there's a schema mismatch,
        // try storing in extracted_json as fallback
        if (tableName !== 'extracted_json' && (error.code === '42P01' || error.code === '42703')) {
          console.log('🔄 Trying fallback insertion to extracted_json table...');
          
          const fallbackData = validData.map((record, index) => ({
            json_extract: record,
            file_name: record.file_name || record.fileName || `workflow_record_${index + 1}_${Date.now()}`
          }));
          
          const { data: fallbackInserted, error: fallbackError } = await supabase
            .from('extracted_json')
            .insert(fallbackData)
            .select();
          
          if (fallbackError) {
            console.error('❌ Fallback insertion also failed:', fallbackError);
            throw fallbackError;
          }
          
          console.log('✅ Fallback insertion successful:', fallbackInserted?.length || 0, 'records');
          return {
            recordsStored: fallbackInserted?.length || 0,
            recordsProcessed: data.length
          };
        }
        
        throw error;
      }
      
      const recordsStored = insertedData?.length || 0;
      console.log('✅ Successfully stored', recordsStored, 'records in', tableName);
      
      return {
        recordsStored,
        recordsProcessed: data.length
      };
      
    } catch (error) {
      console.error('❌ DatabaseStorageService error:', error);
      
      // Return partial success if some data processing occurred
      return {
        recordsStored: 0,
        recordsProcessed: data.length
      };
    }
  }
  
  async validateTableSchema(tableName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error && error.code === '42P01') {
        console.warn(`⚠️ Table ${tableName} does not exist`);
        return false;
      }
      
      return !error;
    } catch (error) {
      console.error('❌ Table validation error:', error);
      return false;
    }
  }
}
