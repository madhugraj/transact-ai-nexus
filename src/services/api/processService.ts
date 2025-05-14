
import { ApiResponse } from './types';
import { ProcessingOptions, PostProcessAction } from '@/types/processing';

/**
 * Process uploaded files with specified action and options
 */
export const processFile = async (
  fileIds: string[],
  action: PostProcessAction,
  options: ProcessingOptions = {}
): Promise<ApiResponse<{ processingId: string }>> => {
  try {
    // Mock API for now, would call actual API in production
    console.log(`Processing files: ${fileIds} with action: ${action}`);
    
    // Simulate API request
    return {
      success: true,
      data: {
        processingId: `proc_${Date.now()}`
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process files'
    };
  }
};

/**
 * Check the status of a processing job
 */
export const checkProcessingStatus = async (
  processingId: string
): Promise<ApiResponse<{ 
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  tables?: any[];
  error?: string;
}>> => {
  try {
    // Mock API for now, would call actual API in production
    console.log(`Checking status for processing ID: ${processingId}`);
    
    // Simulate processing completion after 3 seconds
    const timestamp = parseInt(processingId.split('_')[1]);
    const elapsed = Date.now() - timestamp;
    
    if (elapsed < 3000) {
      return {
        success: true,
        data: {
          status: 'processing',
          progress: Math.min(95, Math.floor((elapsed / 3000) * 100))
        }
      };
    }
    
    // Mock successful completion
    return {
      success: true,
      data: {
        status: 'completed',
        progress: 100,
        tables: [
          {
            id: 'table_1',
            name: 'Extracted Table 1',
            rows: 15,
            columns: 5,
            headers: ['Date', 'Description', 'Amount', 'Category', 'Reference']
          }
        ]
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check processing status'
    };
  }
};
