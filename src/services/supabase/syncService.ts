
import { supabase } from "@/integrations/supabase/client";
import { saveExtractedTable } from "./tableService";

/**
 * Sync local storage tables with Supabase
 */
export const syncLocalStorageWithSupabase = async () => {
  try {
    // Get tables from localStorage
    const tablesStr = localStorage.getItem('processedTables');
    
    if (!tablesStr) return;
    
    const tables = JSON.parse(tablesStr);
    
    for (const table of tables) {
      if (table.headers && table.rows) {
        // Create a file record
        const { data: fileData } = await supabase
          .from('uploaded_files')
          .insert({
            name: table.name || 'Imported Table',
            file_type: 'application/json',
            file_size: JSON.stringify(table).length,
            processed: true
          })
          .select()
          .single();
          
        if (fileData) {
          // Save the table
          await saveExtractedTable(
            fileData.id,
            table.name || 'Imported Table',
            table.headers,
            table.rows,
            table.confidence || 0.9
          );
        }
      }
    }
    
    console.log('Synced local tables with Supabase');
  } catch (error) {
    console.error('Error syncing localStorage with Supabase:', error);
  }
};
