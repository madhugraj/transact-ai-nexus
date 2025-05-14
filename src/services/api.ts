
import { ProcessingOptions, PostProcessAction } from "@/types/processing";
import { UploadedFile } from "@/types/fileUpload";
import { useToast } from "@/hooks/use-toast";

// Base API URL - in a real application, this would come from environment variables
const API_BASE_URL = "/api";

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

// Upload file to backend
export async function uploadFile(file: File): Promise<ApiResponse<UploadResponse>> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.message || `Upload failed with status: ${response.status}` 
      };
    }

    const data = await response.json();
    return { success: true, data };
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
    // Map frontend options to backend AgentState model
    const payload = {
      fileIds,
      action,
      options: {
        tableFormat: options.tableFormat,
        ocrSettings: {
          enabled: options.ocrOptions?.enabled || false,
          enhanceImage: options.ocrOptions?.enhanceImage || false,
          language: options.ocrOptions?.language || 'eng',
        },
        extractionSettings: {
          confidenceThreshold: options.extractionOptions?.confidenceThreshold || 0.8,
          detectMultipleTables: options.extractionOptions?.detectMultipleTables || false,
        },
        dataProcessingSettings: {
          normalizeData: options.dataProcessing?.normalizeData || false,
          removeEmptyRows: options.dataProcessing?.removeEmptyRows || false,
          detectTypes: options.dataProcessing?.detectTypes || false,
        },
        databaseOptions: options.databaseOptions,
      }
    };

    const response = await fetch(`${API_BASE_URL}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.message || `Processing failed with status: ${response.status}` 
      };
    }

    const data = await response.json();
    return { success: true, data };
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
    const response = await fetch(`${API_BASE_URL}/process/${processingId}/status`);
    
    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.message || `Failed to get status with status: ${response.status}` 
      };
    }

    const data = await response.json();
    return { success: true, data };
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
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(searchTerm ? { search: searchTerm } : {})
    });
    
    const response = await fetch(`${API_BASE_URL}/table-preview/${fileId}?${queryParams}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.message || `Failed to get table preview with status: ${response.status}` 
      };
    }

    const data = await response.json();
    return { success: true, data };
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
    const response = await fetch(`${API_BASE_URL}/export/${fileId}?format=${format}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.message || `Export failed with status: ${response.status}` 
      };
    }

    const data = await response.blob();
    return { success: true, data };
  } catch (error) {
    console.error('Error exporting data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during export' 
    };
  }
}
