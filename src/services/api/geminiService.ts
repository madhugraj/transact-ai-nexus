
/**
 * Export all Gemini services from the refactored modules
 */
export { fileToBase64 } from './gemini/fileUtils';
export { processImageWithGemini } from './gemini/visionService';
export { 
  extractTablesFromImageWithGemini,
  DEFAULT_TABLE_EXTRACTION_PROMPT 
} from './gemini/tableExtractor';
export { generateInsightsWithGemini } from './gemini/insightGenerator';
