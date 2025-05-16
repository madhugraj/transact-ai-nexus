
import { supabase } from "@/integrations/supabase/client";

/**
 * Save extracted table data to Supabase
 */
export const saveExtractedTable = async (
  fileId: string,
  title: string,
  headers: string[],
  rows: any[],
  confidence: number = 0.9
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('extracted_tables')
      .insert({
        file_id: fileId,
        title,
        headers,
        rows,
        confidence
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error saving extracted table:', error);
      return null;
    }
    
    // Mark the file as processed
    await supabase
      .from('uploaded_files')
      .update({ processed: true })
      .eq('id', fileId);
      
    return data.id;
  } catch (error) {
    console.error('Error in saveExtractedTable:', error);
    return null;
  }
};

/**
 * Get all extracted tables from Supabase
 */
export const getExtractedTables = async () => {
  try {
    const { data, error } = await supabase
      .from('extracted_tables')
      .select(`
        id,
        title,
        headers,
        rows,
        created_at,
        confidence,
        file_id,
        uploaded_files (name, file_type)
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching extracted tables:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error in getExtractedTables:', error);
    return [];
  }
};

/**
 * Get an extracted table by ID
 */
export const getTableById = async (tableId: string) => {
  try {
    const { data, error } = await supabase
      .from('extracted_tables')
      .select(`
        id,
        title,
        headers,
        rows,
        created_at,
        confidence,
        file_id,
        uploaded_files (name, file_type)
      `)
      .eq('id', tableId)
      .single();
      
    if (error) {
      console.error('Error fetching table by ID:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getTableById:', error);
    return null;
  }
};

/**
 * Delete an extracted table and associated file
 */
export const deleteExtractedTable = async (tableId: string) => {
  try {
    // Get the file_id first
    const { data: tableData } = await supabase
      .from('extracted_tables')
      .select('file_id')
      .eq('id', tableId)
      .single();
      
    if (!tableData) return false;
    
    // Delete the table record
    const { error: tableError } = await supabase
      .from('extracted_tables')
      .delete()
      .eq('id', tableId);
      
    if (tableError) {
      console.error('Error deleting table:', tableError);
      return false;
    }
    
    // Check if there are other tables using this file
    const { data: otherTables } = await supabase
      .from('extracted_tables')
      .select('id')
      .eq('file_id', tableData.file_id);
      
    // If no other tables use this file, delete the file too
    if (!otherTables || otherTables.length === 0) {
      // Get storage path
      const { data: fileData } = await supabase
        .from('uploaded_files')
        .select('storage_path')
        .eq('id', tableData.file_id)
        .single();
        
      if (fileData?.storage_path) {
        // Delete from storage
        await supabase.storage
          .from('document_files')
          .remove([fileData.storage_path]);
      }
      
      // Delete file record
      await supabase
        .from('uploaded_files')
        .delete()
        .eq('id', tableData.file_id);
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteExtractedTable:', error);
    return false;
  }
};
