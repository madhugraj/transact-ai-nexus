
import { ApiResponse } from './types';

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

// Get table preview data
export async function getTablePreview(
  fileId: string, 
  page: number = 1, 
  pageSize: number = 10, 
  searchTerm: string = ''
): Promise<ApiResponse<TableData>> {
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
