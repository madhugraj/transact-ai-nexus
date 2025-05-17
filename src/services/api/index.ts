
// Re-export all API functions for easy access
export * from './uploadService';
export * from './fileService';
export * from './tableService';
export * from './processService';
export * from './gemini/visionService';
export * from './gemini/insightGenerator';

/**
 * Convert a file to base64
 * @param file The file to convert
 * @returns Promise resolving to the base64-encoded string
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

/**
 * Process a file using specified action and options
 * @param fileIds Array of file IDs to process
 * @param action Processing action to perform
 * @param options Processing options
 * @returns Promise resolving to processing result
 */
export const processFile = async (
  fileIds: string[],
  action: string,
  options: any = {}
): Promise<ApiResponse<any>> => {
  console.log(`Processing files with action: ${action}`, { fileIds, options });
  
  // Simulate API call with delay
  return new Promise(resolve => {
    setTimeout(() => {
      // Mock processing ID
      const processingId = `proc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      resolve({
        success: true,
        data: {
          processingId,
          status: 'processing',
          message: 'File processing started'
        }
      });
    }, 1000);
  });
};

/**
 * Extract tables from an image using Gemini
 */
export { extractTablesFromImageWithGemini } from './gemini/visionService';
