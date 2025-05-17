
/**
 * Export all Gemini services from the refactored modules
 */
export { fileToBase64 } from './gemini/fileUtils';
export { processImageWithGemini, DEFAULT_TABLE_EXTRACTION_PROMPT } from './gemini/visionService';
export { 
  extractTablesFromImageWithGemini
} from './gemini/tableExtractor';
export { generateInsightsWithGemini } from './gemini/insightGenerator';
