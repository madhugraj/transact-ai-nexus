
import { ApiResponse } from './types';

/**
 * Upload a file to the system
 * @param file The file to upload
 * @returns ApiResponse with the uploaded file ID
 */
export const uploadFile = async (file: File): Promise<ApiResponse<{fileId: string}>> => {
  console.log(`Uploading file: ${file.name}`);
  
  return new Promise((resolve) => {
    // Simulate upload delay
    setTimeout(() => {
      // Mock successful upload with generated file ID
      const fileId = `file_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      resolve({
        success: true,
        data: {
          fileId
        }
      });
    }, 1500); // Simulated delay
  });
};
