
import { ApiResponse } from './types';

/**
 * Get a URL for a file stored in the system
 * @param fileId The ID of the file to retrieve
 * @returns ApiResponse with the file URL
 */
export const getFileUrl = (fileId: string): Promise<ApiResponse<string>> => {
  return Promise.resolve({
    success: true,
    data: `https://placehold.co/600x400?text=${fileId}`
  });
};

/**
 * Delete a file from the system
 * @param fileId The ID of the file to delete
 * @returns ApiResponse indicating success or failure
 */
export const deleteFile = async (fileId: string): Promise<ApiResponse<boolean>> => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      console.log(`Deleting file with ID: ${fileId}`);
      // Mock successful deletion
      resolve({
        success: true,
        data: true
      });
    }, 800);
  });
};

/**
 * Get all files for a user
 * @returns ApiResponse with an array of file metadata
 */
export const getUserFiles = async (): Promise<ApiResponse<{id: string, name: string, type: string, size: number, createdAt: string}[]>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: [
          {
            id: 'file_1',
            name: 'financial_report.pdf',
            type: 'application/pdf',
            size: 1024 * 1024 * 2.5, // 2.5MB
            createdAt: new Date().toISOString()
          },
          {
            id: 'file_2',
            name: 'sales_data.csv',
            type: 'text/csv',
            size: 1024 * 512, // 512KB
            createdAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      });
    }, 1000);
  });
};

/**
 * Get file metadata
 * @param fileId The ID of the file to get metadata for
 * @returns ApiResponse with the file metadata
 */
export const getFileMetadata = async (fileId: string): Promise<ApiResponse<{id: string, name: string, type: string, size: number, createdAt: string}>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          id: fileId,
          name: `file_${fileId.split('_')[1]}.pdf`,
          type: 'application/pdf',
          size: 1024 * 1024 * 1.5, // 1.5MB
          createdAt: new Date().toISOString()
        }
      });
    }, 500);
  });
};
