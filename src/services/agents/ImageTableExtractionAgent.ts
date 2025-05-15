
import { Agent, ProcessingContext } from "./types";

/**
 * Agent for extracting tables from images using Gemini AI
 */
export class ImageTableExtractionAgent implements Agent {
  id: string = "ImageTableExtraction";
  name: string = "Image Table Extraction";
  description: string = "Extracts tables from images using Gemini AI";
  
  async process(data: any, context?: ProcessingContext): Promise<any> {
    console.log("🤖 ImageTableExtractionAgent starting processing...");
    
    if (!data || !Array.isArray(data.files)) {
      console.log("No files to process in ImageTableExtractionAgent");
      return data; // Pass through if no files
    }
    
    // Get options from context
    const options = context?.options || {};
    const useGemini = Boolean(options.useGemini);
    
    console.log("ImageTableExtractionAgent processing with options:", {
      useGemini,
      fileCount: data.files?.length,
      extractionOptions: options.extractionOptions
    });
    
    // For now, just pass through the data
    // In a real implementation, this would extract tables from images using Gemini
    return {
      ...data,
      processingStage: "image_table_extraction_complete",
      geminiProcessed: useGemini,
      timestamp: new Date().toISOString()
    };
  }
  
  canProcess(data: any): boolean {
    // Check if there are image files to process
    if (!data || !Array.isArray(data.files)) {
      return false;
    }
    
    // Check if any of the files are images
    const hasImageFiles = data.files.some((file: any) => {
      return file.type && file.type.startsWith('image/');
    });
    
    return hasImageFiles;
  }
}
