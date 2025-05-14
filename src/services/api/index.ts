
// Re-export all API services and types for consistent usage
import { ApiResponse } from './types';
export * from './types';
export * from './geminiService';
export * from './processService';
export * from './uploadService';
export * from './dataService';

// Import and re-export tableService with renamed exports to avoid conflicts
import { 
  TableData, 
  getTablePreview, 
  exportTableData 
} from './tableService';

// Re-export with specific names to avoid conflicts
export type { TableData as TableServiceTableData };
export { 
  getTablePreview as getTableServicePreview, 
  exportTableData as exportTableServiceData 
};
