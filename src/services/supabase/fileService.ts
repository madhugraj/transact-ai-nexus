
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

const STORAGE_BUCKET = 'document_files';

/**
 * Ensure storage bucket exists
 */
export const ensureStorageBucketExists = async () => {
  try {
    console.log(`Checking if storage bucket '${STORAGE_BUCKET}' exists...`);
    
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing storage buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);

    if (!bucketExists) {
      console.log(`Storage bucket '${STORAGE_BUCKET}' does not exist. Creating it...`);
      
      // Create the bucket with public access for simplicity
      const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (error) {
        console.error('Error creating storage bucket:', error);
        // Check for more specific error types and provide better feedback
        if (error.message.includes('duplicate key value')) {
          console.log('Bucket already exists (race condition). Continuing...');
          return true;
        }
        
        if (error.message.includes('row-level security')) {
          console.error('This appears to be a permissions error. RLS policies may need to be configured.');
        }
        return false;
      }
      
      console.log(`Storage bucket '${STORAGE_BUCKET}' created successfully`);
    } else {
      console.log(`Storage bucket '${STORAGE_BUCKET}' already exists`);
    }
    
    // Verify bucket exists after creation attempt
    const { data: verifyBuckets } = await supabase.storage.listBuckets();
    const verified = verifyBuckets?.some(bucket => bucket.name === STORAGE_BUCKET);
    
    return verified;
  } catch (error) {
    console.error('Error checking/creating storage bucket:', error);
    return false;
  }
};

/**
 * Upload a file to Supabase storage
 */
export const uploadFileToStorage = async (file: File): Promise<{ path: string; fileId: string } | null> => {
  try {
    // Ensure bucket exists before attempting upload
    const bucketExists = await ensureStorageBucketExists();
    
    if (!bucketExists) {
      console.error('Storage bucket does not exist and could not be created');
      return null;
    }
    
    const fileExt = file.name.split('.').pop();
    const filePath = `${uuidv4()}.${fileExt}`;
    
    console.log(`Uploading file ${file.name} to storage path ${filePath}`);
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error('Error uploading file to storage:', error);
      return null;
    }
    
    console.log('File uploaded successfully:', data);
    
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
    
    console.log('File record created:', fileData);
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
