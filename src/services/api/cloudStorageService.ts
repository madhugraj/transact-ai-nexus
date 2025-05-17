
import { ApiResponse } from './types';
import { CloudFile, CloudStorageProvider, CloudStorageAuthResult } from '@/types/cloudStorage';

/**
 * Connect to a cloud storage provider
 * @param provider The cloud storage provider to connect to
 * @param params Additional parameters needed for connection
 * @returns ApiResponse with connection details
 */
export const connectToCloudStorage = (
  provider: CloudStorageProvider,
  params?: Record<string, string>
): Promise<ApiResponse<CloudStorageAuthResult>> => {
  console.log(`Connecting to ${provider} with params:`, params);
  
  // Mock successful authentication
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          provider,
          accessToken: `mock-token-${provider}-${Date.now()}`,
          success: true,
          expiresAt: new Date(Date.now() + 3600 * 1000) // Token expires in 1 hour
        }
      });
    }, 1500);
  });
};

/**
 * List files from a connected cloud storage
 * @param provider The cloud storage provider
 * @param folderId Optional folder ID to list contents from (null for root)
 * @param query Optional search query
 * @returns ApiResponse with list of cloud files
 */
export const listCloudStorageFiles = (
  provider: CloudStorageProvider,
  folderId?: string | null,
  query?: string
): Promise<ApiResponse<CloudFile[]>> => {
  console.log(`Listing files from ${provider}, folder: ${folderId || 'root'}, query: ${query || 'none'}`);
  
  // Mock files listing
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate between 5-15 mock files
      const fileCount = Math.floor(Math.random() * 10) + 5;
      const files: CloudFile[] = [];
      
      // Add a few folders
      for (let i = 0; i < 3; i++) {
        files.push({
          id: `folder-${i}-${Date.now()}`,
          name: `Folder ${i + 1}${query ? ` (${query})` : ''}`,
          mimeType: 'application/vnd.google-apps.folder',
          size: 0,
          lastModified: new Date(Date.now() - i * 24 * 3600 * 1000),
          provider,
          parentId: folderId || undefined,
          isFolder: true
        });
      }
      
      // Add files
      for (let i = 0; i < fileCount; i++) {
        // Randomly decide file type
        const fileTypes = [
          {mime: 'application/pdf', ext: 'pdf'},
          {mime: 'image/jpeg', ext: 'jpg'},
          {mime: 'image/png', ext: 'png'},
          {mime: 'application/vnd.ms-excel', ext: 'xls'},
          {mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: 'xlsx'},
          {mime: 'text/csv', ext: 'csv'}
        ];
        const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
        
        files.push({
          id: `file-${i}-${Date.now()}`,
          name: `Document ${i + 1}.${fileType.ext}${query ? ` (${query})` : ''}`,
          mimeType: fileType.mime,
          size: Math.floor(Math.random() * 5000000) + 10000, // Random size between 10KB and 5MB
          lastModified: new Date(Date.now() - i * 3600 * 1000),
          provider,
          parentId: folderId || undefined,
          isFolder: false
        });
      }
      
      resolve({
        success: true,
        data: files
      });
    }, 1500);
  });
};

/**
 * Download a file from cloud storage
 * @param file The cloud file to download
 * @returns ApiResponse with the downloaded file as a Blob
 */
export const downloadCloudFile = (file: CloudFile): Promise<ApiResponse<File>> => {
  console.log(`Downloading file: ${file.name} from ${file.provider}`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Create a mock file based on the mimetype
      let content: string | ArrayBuffer;
      
      if (file.mimeType.includes('image')) {
        // For image files, create a small colored rectangle
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 80%)`;
          ctx.fillRect(0, 0, 100, 100);
          canvas.toBlob((blob) => {
            if (blob) {
              const mockFile = new File([blob], file.name, { type: file.mimeType });
              resolve({
                success: true,
                data: mockFile
              });
            }
          });
        }
      } else {
        // For other files, create a mock file with appropriate content
        let content = `Mock content for ${file.name}\nProvider: ${file.provider}\nSize: ${file.size} bytes`;
        const mockFile = new File([content], file.name, { type: file.mimeType });
        resolve({
          success: true,
          data: mockFile
        });
      }
    }, 2000);
  });
};

/**
 * Classify a document
 * @param file The file to classify
 * @returns ApiResponse with the classification result
 */
export const classifyDocument = async (file: File): Promise<ApiResponse<{documentType: string, confidence: number}>> => {
  console.log(`Classifying document: ${file.name}`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate document classification based on filename or type
      let documentType = 'other';
      let confidence = 0.7 + Math.random() * 0.3; // Between 0.7 and 1.0
      
      const name = file.name.toLowerCase();
      
      if (name.includes('invoice') || name.includes('inv-')) {
        documentType = 'invoice';
        confidence = 0.85 + Math.random() * 0.15;
      } else if (name.includes('po') || name.includes('purchase') || name.includes('order')) {
        documentType = 'purchase_order';
        confidence = 0.8 + Math.random() * 0.2;
      } else if (name.includes('receipt')) {
        documentType = 'receipt';
        confidence = 0.9 + Math.random() * 0.1;
      } else if (name.includes('bill')) {
        documentType = 'bill';
        confidence = 0.85 + Math.random() * 0.15;
      } else if (name.includes('email') || name.includes('mail')) {
        documentType = 'email';
        confidence = 0.75 + Math.random() * 0.2;
      } else if (name.includes('contract') || name.includes('agreement')) {
        documentType = 'contract';
        confidence = 0.8 + Math.random() * 0.15;
      } else if (name.includes('report')) {
        documentType = 'report';
        confidence = 0.75 + Math.random() * 0.2;
      }
      
      resolve({
        success: true,
        data: {
          documentType,
          confidence
        }
      });
    }, 1000);
  });
};
