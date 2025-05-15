
import { ApiResponse } from './types';

export interface TableData {
  headers: string[];
  rows: any[][];
  metadata?: {
    totalRows: number;
    confidence?: number;
    sourceFile?: string;
    title?: string;
  };
}

/**
 * Get a preview of table data
 * @param tableId The ID of the table to preview
 * @param limit The maximum number of rows to return
 * @returns ApiResponse with the table data
 */
export const getTablePreview = async (tableId: string, limit: number = 10): Promise<ApiResponse<TableData>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          headers: ["Category", "Value", "Percentage", "Status"],
          rows: [
            ["Revenue", "$125,430.00", "100%", "Final"],
            ["Expenses", "$78,500.00", "62.6%", "Estimated"],
            ["Profit", "$46,930.00", "37.4%", "Calculated"],
            ["Taxes", "$11,732.50", "9.4%", "Pending"]
          ],
          metadata: {
            totalRows: 4,
            confidence: 0.95,
            sourceFile: "financial_report.pdf",
            title: "Financial Summary"
          }
        }
      });
    }, 500);
  });
};

/**
 * Export table data to a specific format
 * @param tableId The ID of the table to export
 * @param format The format to export to (csv, xlsx, json)
 * @returns ApiResponse with a Blob of the exported data
 */
export const exportTableData = async (tableId: string, format: 'csv' | 'xlsx' | 'json'): Promise<ApiResponse<Blob>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Create a simple mock CSV data
      const csvData = "Category,Value,Percentage,Status\nRevenue,$125430.00,100%,Final\nExpenses,$78500.00,62.6%,Estimated";
      
      // Create a blob with the appropriate MIME type
      const mimeTypes = {
        'csv': 'text/csv',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'json': 'application/json'
      };
      
      const blob = new Blob([csvData], { type: mimeTypes[format] });
      
      resolve({
        success: true,
        data: blob
      });
    }, 800);
  });
};
