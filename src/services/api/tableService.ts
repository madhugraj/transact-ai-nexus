
import { ApiResponse } from './types';

// Define the TableData type that was missing
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
 * Get a preview of a table
 * @param fileId ID of the file to preview
 * @returns ApiResponse with table data
 */
export const getTablePreview = async (fileId: string): Promise<ApiResponse<TableData>> => {
  return new Promise((resolve) => {
    // Simulate API call
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          headers: ["Date", "Description", "Amount", "Category"],
          rows: [
            ["2023-01-15", "Office Supplies", "$120.50", "Expenses"],
            ["2023-01-22", "Client Payment", "$1,500.00", "Income"],
            ["2023-02-05", "Software Subscription", "$49.99", "Expenses"],
            ["2023-02-15", "Consulting Services", "$2,500.00", "Income"],
            ["2023-03-01", "Server Costs", "$150.00", "Expenses"]
          ],
          metadata: {
            totalRows: 5,
            confidence: 0.95,
            sourceFile: fileId
          }
        }
      });
    }, 800);
  });
};

/**
 * Export table data to a file format
 * @param fileId ID of the file to export
 * @param format Format to export to (csv, xlsx, json)
 * @returns ApiResponse with blob data
 */
export const exportTableData = async (fileId: string, format: 'csv' | 'xlsx' | 'json'): Promise<ApiResponse<Blob>> => {
  return new Promise((resolve) => {
    // Simulate API call with delay
    setTimeout(() => {
      // Create a mock blob with appropriate content
      let blob: Blob;
      
      switch(format) {
        case 'csv':
          // Mock CSV content
          blob = new Blob([
            'Date,Description,Amount,Category\n' +
            '2023-01-15,"Office Supplies",$120.50,Expenses\n' +
            '2023-01-22,"Client Payment",$1500.00,Income\n' +
            '2023-02-05,"Software Subscription",$49.99,Expenses\n' +
            '2023-02-15,"Consulting Services",$2500.00,Income\n' +
            '2023-03-01,"Server Costs",$150.00,Expenses'
          ], { type: 'text/csv' });
          break;
          
        case 'xlsx':
          // Mock Excel blob (not real Excel, just a placeholder)
          blob = new Blob(['Excel data would be here'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          break;
          
        case 'json':
          // Mock JSON content
          const jsonData = {
            headers: ["Date", "Description", "Amount", "Category"],
            rows: [
              ["2023-01-15", "Office Supplies", "$120.50", "Expenses"],
              ["2023-01-22", "Client Payment", "$1,500.00", "Income"],
              ["2023-02-05", "Software Subscription", "$49.99", "Expenses"],
              ["2023-02-15", "Consulting Services", "$2,500.00", "Income"],
              ["2023-03-01", "Server Costs", "$150.00", "Expenses"]
            ]
          };
          blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
          break;
      }
      
      resolve({
        success: true,
        data: blob
      });
    }, 1000);
  });
};
