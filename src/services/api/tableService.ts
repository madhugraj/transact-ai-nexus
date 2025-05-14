
import { ApiResponse } from './types';

export interface TableData {
  headers: string[];
  rows: string[][];
  metadata?: {
    totalRows: number;
    confidence: number;
    sourceFile: string;
  };
}

/**
 * Get table preview data for a specific file
 */
export const getTablePreview = async (fileId: string): Promise<ApiResponse<TableData>> => {
  console.log(`Fetching table preview for file: ${fileId}`);
  
  try {
    // Mock table data for preview
    const mockTableData: TableData = {
      headers: ['Date', 'Description', 'Amount', 'Balance'],
      rows: [
        ['01/27/2023', 'GROCERY STORE', '-$125.65', '$3,245.89'],
        ['01/30/2023', 'DIRECT DEPOSIT SALARY', '+$2,450.00', '$5,695.89'],
        ['02/03/2023', 'RENT PAYMENT', '-$1,800.00', '$3,895.89'],
        ['02/10/2023', 'ONLINE PURCHASE', '-$79.99', '$3,815.90'],
        ['02/15/2023', 'RESTAURANT', '-$65.43', '$3,750.47'],
        ['02/20/2023', 'UTILITY BILL', '-$124.56', '$3,625.91']
      ],
      metadata: {
        totalRows: 6,
        confidence: 0.95,
        sourceFile: fileId
      }
    };
    
    return {
      success: true,
      data: mockTableData
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch table preview'
    };
  }
};

/**
 * Export table data to CSV or Excel format
 */
export const exportTableData = async (fileId: string, format: 'csv' | 'excel'): Promise<ApiResponse<Blob>> => {
  console.log(`Exporting table data for file: ${fileId} in ${format} format`);
  
  try {
    // In a real implementation, this would call the backend API to export the data
    // For now, we'll create a simple CSV file as a mock
    const csvContent = 'Date,Description,Amount,Balance\n' +
      '01/27/2023,GROCERY STORE,-$125.65,$3245.89\n' +
      '01/30/2023,DIRECT DEPOSIT SALARY,+$2450.00,$5695.89\n' +
      '02/03/2023,RENT PAYMENT,-$1800.00,$3895.89\n' +
      '02/10/2023,ONLINE PURCHASE,-$79.99,$3815.90\n' +
      '02/15/2023,RESTAURANT,-$65.43,$3750.47\n' +
      '02/20/2023,UTILITY BILL,-$124.56,$3625.91';
    
    // Create a blob from the CSV data
    const blob = new Blob([csvContent], { type: format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel' });
    
    return {
      success: true,
      data: blob
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export table data'
    };
  }
};
