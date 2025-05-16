
import { supabase } from "@/integrations/supabase/client";
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
