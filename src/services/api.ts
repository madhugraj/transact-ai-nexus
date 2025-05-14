
import { ProcessingOptions, PostProcessAction } from "@/types/processing";
import { UploadedFile } from "@/types/fileUpload";

// Base API URL - in a real application, this would come from environment variables
const API_BASE_URL = ""; // Changed from "/api" to empty string for mock implementation

// Interface for API responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Interface for the upload response
interface UploadResponse {
  fileId: string;
  originalName: string;
  path: string;
}

// Interface for the processing response
interface ProcessingResponse {
  processingId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
}

// Interface for table data
export interface TableData {
  headers: string[];
  rows: string[][];
  metadata: {
    totalRows: number;
    confidence: number;
    sourceFile: string;
  };
}

// Upload file to backend - now mocking the API response
export async function uploadFile(file: File): Promise<ApiResponse<UploadResponse>> {
  try {
    // Mock implementation for testing
    // In a real app, this would send the file to a server
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

// Process file with specified options
export async function processFile(
  fileIds: string[], 
  action: PostProcessAction,
  options: ProcessingOptions
): Promise<ApiResponse<ProcessingResponse>> {
  try {
    console.log("Processing files:", fileIds, "with action:", action);
    
    // Mock implementation
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            processingId: `process-${Date.now()}`,
            status: 'pending',
            message: 'Processing started'
          }
        });
      }, 1000);
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during processing' 
    };
  }
}

// Get processing status
export async function getProcessingStatus(processingId: string): Promise<ApiResponse<ProcessingResponse>> {
  try {
    console.log("Checking status for:", processingId);
    
    // Mock implementation that completes after a few seconds
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            processingId: processingId,
            status: 'completed',
            message: 'Processing completed successfully'
          }
        });
      }, 3000);
    });
  } catch (error) {
    console.error('Error getting processing status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error getting status' 
    };
  }
}

// Get table preview data
export async function getTablePreview(fileId: string, page: number = 1, pageSize: number = 10, searchTerm: string = ''): Promise<ApiResponse<TableData>> {
  try {
    console.log("Getting table preview for:", fileId, "page:", page);
    
    // Mock implementation
    return new Promise(resolve => {
      setTimeout(() => {
        // Generate some mock data
        const headers = ['ID', 'Name', 'Date', 'Amount', 'Category'];
        const rows = Array.from({ length: 50 }, (_, i) => [
          `${i + 1}`,
          `Item ${i + 1}`,
          `2025-05-${(i % 30) + 1}`,
          `$${(Math.random() * 1000).toFixed(2)}`,
          ['Income', 'Expense', 'Transfer'][i % 3]
        ]);
        
        // Implement pagination
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedRows = rows.slice(startIndex, endIndex);
        
        resolve({
          success: true,
          data: {
            headers,
            rows: paginatedRows,
            metadata: {
              totalRows: rows.length,
              confidence: 0.95,
              sourceFile: fileId
            }
          }
        });
      }, 1000);
    });
  } catch (error) {
    console.error('Error getting table preview:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error getting table preview' 
    };
  }
}

// Export table data in specified format
export async function exportTableData(fileId: string, format: 'csv' | 'excel'): Promise<ApiResponse<Blob>> {
  try {
    console.log("Exporting data for:", fileId, "format:", format);
    
    // Mock implementation
    return new Promise(resolve => {
      setTimeout(() => {
        // Create a simple CSV string
        const csvContent = "ID,Name,Date,Amount,Category\n1,Item 1,2025-05-01,$123.45,Income";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        
        resolve({
          success: true,
          data: blob
        });
      }, 1000);
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during export' 
    };
  }
}
