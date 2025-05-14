
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
        // Generate some mock data based on financial document structure
        const headers = ['Date', 'Description', 'Amount', 'Balance'];
        const rows = Array.from({ length: 50 }, (_, i) => [
          `2025-05-${(i % 30) + 1}`,
          `Transaction ${i + 1}`,
          `$${(Math.random() * 1000).toFixed(2)}`,
          `$${(Math.random() * 10000).toFixed(2)}`
        ]);
        
        // Filter by search term if provided
        const filteredRows = searchTerm ? 
          rows.filter(row => row.some(cell => 
            cell.toLowerCase().includes(searchTerm.toLowerCase())
          )) : 
          rows;
        
        // Implement pagination
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedRows = filteredRows.slice(startIndex, endIndex);
        
        resolve({
          success: true,
          data: {
            headers,
            rows: paginatedRows,
            metadata: {
              totalRows: filteredRows.length,
              confidence: 0.95,
              sourceFile: fileId
            }
          }
        });
      }, 800);
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
        // Create a simple CSV string with financial data
        const csvContent = "Date,Description,Amount,Balance\n2025-05-01,Direct Deposit,$2450.00,$5678.90\n2025-05-02,ATM Withdrawal,-$100.00,$5578.90\n2025-05-03,Online Payment,-$245.67,$5333.23";
        const blob = new Blob([csvContent], { type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
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
