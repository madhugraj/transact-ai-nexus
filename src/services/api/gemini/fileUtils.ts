
/**
 * Utility functions for file operations
 */

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
 * Get file metadata including size, type, and dimensions (for images)
 * @param file The file to extract metadata from
 * @returns Promise resolving to file metadata
 */
export const getFileMetadata = (file: File): Promise<any> => {
  return new Promise((resolve) => {
    const metadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString(),
      dimensions: null
    };
    
    // Extract image dimensions if it's an image
    if (file.type.startsWith('image/')) {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        metadata.dimensions = {
          width: img.width,
          height: img.height
        };
        URL.revokeObjectURL(objectUrl);
        resolve(metadata);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(metadata);
      };
      
      img.src = objectUrl;
    } else {
      resolve(metadata);
    }
  });
};

/**
 * Detect the type of document based on its content and metadata
 * @param file The file to classify
 * @returns Promise resolving to document type classification
 */
export const classifyDocument = async (file: File): Promise<string> => {
  // Base classification on file extension and type
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  // Simple classification based on file extension and type
  if (file.type === 'application/pdf') {
    return 'document';
  }
  
  if (file.type.startsWith('image/')) {
    return 'image';
  }
  
  if (['csv', 'xlsx', 'xls'].includes(extension || '') || 
      file.type === 'text/csv' ||
      file.type.includes('spreadsheet') ||
      file.type.includes('excel')) {
    return 'data';
  }
  
  // Default classification
  return 'other';
};
