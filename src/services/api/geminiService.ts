
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

// Add a convenience function that combines fileToBase64 and extractTablesFromImageWithGemini
export async function extractTablesFromImage(
  file: File,
  customPrompt?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Import fileToBase64 from the local module to use it here
    const { fileToBase64 } = await import('./gemini/fileUtils');
    const base64Image = await fileToBase64(file);
    
    // Import extractTablesFromImageWithGemini from the local module
    const { extractTablesFromImageWithGemini } = await import('./gemini/tableExtractor');
    return extractTablesFromImageWithGemini(base64Image, file.type, customPrompt);
  } catch (error) {
    console.error("Error extracting tables from image:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
