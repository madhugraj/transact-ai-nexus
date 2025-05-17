
/**
 * Export all Gemini services from the refactored modules
 */
export { fileToBase64 } from './gemini/fileUtils';
export { 
  processImageWithGemini, 
  DEFAULT_TABLE_EXTRACTION_PROMPT,
  extractTablesFromImageWithGemini
} from './gemini/visionService';
export { generateInsightsWithGemini } from './gemini/insightGenerator';
