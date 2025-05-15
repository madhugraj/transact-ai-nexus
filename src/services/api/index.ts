
// Re-export services
export * from './uploadService';
export * from './processService';
export * from './fileService';
export * from './dataService';
export { 
  generateInsightsWithGemini,
  processImageWithGemini,
  fileToBase64
} from './geminiService';  // Explicitly export Gemini service functions to avoid conflicts

// Export tableService with explicit naming to avoid conflicts
export { 
  getTablePreview,
  exportTableData
} from './tableService';

// Re-export types using 'export type' syntax for isolatedModules compatibility
export type { TableData } from './tableService';

// Types
export * from './types';
