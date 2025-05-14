
import { ApiResponse } from './types';

export interface TableData {
  headers: string[];
  rows: string[][];
  metadata?: {
    totalRows: number;
    confidence: number;
    sourceFile: string;
  }
}

/**
 * Get a preview of the extracted table
 */
export const getTablePreview = async (fileId: string): Promise<ApiResponse<TableData>> => {
  console.log(`Getting table preview for file: ${fileId}`);
  
  // Simulate API call with mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          headers: ["Date", "Description", "Amount", "Balance"],
          rows: [
            ["2025-05-01", "Direct Deposit", "+$2,450.00", "$5,678.90"],
            ["2025-05-02", "ATM Withdrawal", "-$100.00", "$5,578.90"],
            ["2025-05-03", "Online Payment", "-$245.67", "$5,333.23"],
            ["2025-05-05", "Check #1234", "-$1,200.00", "$4,133.23"],
            ["2025-05-10", "Grocery Store", "-$85.75", "$4,047.48"],
          ],
          metadata: {
            totalRows: 5,
            confidence: 0.95,
            sourceFile: fileId
          }
        }
      });
    }, 600);
  });
};

/**
 * Export table data to a specific format
 */
export const exportTableData = async (fileId: string, format: 'csv' | 'excel'): Promise<ApiResponse<Blob>> => {
  console.log(`Exporting table data for file: ${fileId} in ${format} format`);
  
  // Mock implementation
  return new Promise((resolve) => {
    setTimeout(() => {
      // Create a simple CSV string
      let csvContent = "Date,Description,Amount,Balance\n";
      csvContent += "2025-05-01,Direct Deposit,+$2450.00,$5678.90\n";
      csvContent += "2025-05-02,ATM Withdrawal,-$100.00,$5578.90\n";
      csvContent += "2025-05-03,Online Payment,-$245.67,$5333.23\n";
      
      // Convert to blob
      const blob = new Blob([csvContent], { type: format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel' });
      
      resolve({
        success: true,
        data: blob
      });
    }, 800);
  });
};
