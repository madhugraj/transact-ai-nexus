
import { ApiResponse } from './types';

// Interface for the upload response
export interface UploadResponse {
  fileId: string;
  originalName: string;
  path: string;
}

// Upload file to backend - mocking the API response for testing
export async function uploadFile(file: File): Promise<ApiResponse<UploadResponse>> {
  try {
    // Mock implementation for testing
    console.log("Uploading file:", file.name);
    
    // Create a mock response after a short delay to simulate network request
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            fileId: `file-${Date.now()}`,
            originalName: file.name,
            path: `/uploads/${file.name}`
          }
        });
      }, 1000);
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during file upload' 
    };
  }
}
