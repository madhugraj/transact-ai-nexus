
import { supabase } from "@/integrations/supabase/client";
import { UploadedFile } from "@/types/fileUpload";
import { v4 as uuidv4 } from 'uuid';

const STORAGE_BUCKET = 'document_files';

/**
 * Upload a file to Supabase storage
 */
export const uploadFileToStorage = async (file: File): Promise<{ path: string; fileId: string } | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `${uuidv4()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file);
      
    if (error) {
      console.error('Error uploading file to storage:', error);
      return null;
    }
    
    // Create an entry in the uploaded_files table
    const { data: fileData, error: fileError } = await supabase
      .from('uploaded_files')
      .insert({
        name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: data.path
      })
      .select()
      .single();
      
    if (fileError) {
      console.error('Error creating file record:', fileError);
      return null;
    }
    
    return { path: data.path, fileId: fileData.id };
  } catch (error) {
    console.error('Error in uploadFileToStorage:', error);
    return null;
  }
};

/**
 * Get file URL from Supabase storage
 */
export const getFileUrl = async (path: string): Promise<string | null> => {
  try {
    const { data } = await supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);
      
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting file URL:', error);
    return null;
  }
};

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
 * Check if a file has already been processed based on name and size
 */
export const checkFileProcessed = async (fileName: string, fileSize: number) => {
  try {
    const { data, error } = await supabase
      .from('uploaded_files')
      .select('id, processed')
      .eq('name', fileName)
      .eq('file_size', fileSize)
      .limit(1);
      
    if (error || !data.length) {
      return null;
    }
    
    return data[0];
  } catch (error) {
    console.error('Error checking if file is processed:', error);
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
          .from(STORAGE_BUCKET)
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

/**
 * Update the document storage utility to use Supabase
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
