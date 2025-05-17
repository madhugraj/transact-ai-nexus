
import { ApiResponse } from './types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Upload a file to the system
 * @param file The file to upload
 * @returns ApiResponse with the uploaded file ID
 */
export const uploadFile = async (file: File): Promise<ApiResponse<{fileId: string}>> => {
  console.log(`Uploading file: ${file.name}`);
  
  try {
    // Create a record in uploaded_files table
    const { data, error } = await supabase
      .from('uploaded_files')
      .insert({
        name: file.name,
        file_type: file.type,
        file_size: file.size,
        processed: false
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error saving file to database:", error);
      return {
        success: false,
        error: `Database error: ${error.message}`
      };
    }
    
    // Return the file ID for further processing
    return {
      success: true,
      data: {
        fileId: data.id
      }
    };
  } catch (error) {
    console.error("Exception during file upload:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown upload error"
    };
  }
};

/**
 * Convert file to base64 for processing
 * @param file File to convert
 * @returns Base64 string representation of the file
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64Content = base64String.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = error => reject(error);
  });
};
