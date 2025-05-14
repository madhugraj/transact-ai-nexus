
import { ApiResponse } from './types';

/**
 * Upload a file to the backend
 */
export interface UploadResponse {
  fileId: string;
  name: string;
  type: string;
  status: 'success';
}

export const uploadFile = async (file: File): Promise<ApiResponse<UploadResponse>> => {
  console.log(`Uploading file: ${file.name} (${file.type})`);
  
  try {
    // Mock implementation - in a real app this would call an API endpoint
    // Simulate network delay for more realistic behavior
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      data: {
        fileId: `file-${Date.now()}`,
        name: file.name,
        type: file.type,
        status: 'success'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error uploading file'
    };
  }
};
