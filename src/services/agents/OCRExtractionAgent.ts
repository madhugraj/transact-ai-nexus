
import { Agent, ProcessingContext } from "./types";
import * as api from '@/services/api';

export class OCRExtractionAgent implements Agent {
  id: string = "OCRExtraction";
  name: string = "OCR Extraction Agent";
  description: string = "Extracts text from images and PDFs using OCR with Gemini Vision";
  
  async process(data: any, context?: ProcessingContext): Promise<any> {
    console.log("🤖 OCRExtractionAgent processing with Gemini:", context?.options?.useGemini);
    
    // Extract file IDs from previous agent
    const { fileIds, options } = this.extractInputData(data, context);
    
    // Default OCR settings
    const ocrSettings = {
      enabled: true,
      enhanceResolution: true,
      language: "eng",
      useGemini: context?.options?.useGemini || false,
      ...options?.ocrSettings
    };
    
    let response;
    
    // Check if we should use Gemini Vision for enhanced OCR
    if (ocrSettings.useGemini && data.fileObjects && data.fileObjects.length > 0) {
      console.log("🔍 Using Gemini Vision for OCR processing");
      // Process each file with Gemini Vision
      const geminiResults = [];
      
      for (const file of data.fileObjects) {
        try {
          // Only process image files with Gemini Vision
          if (file.type.startsWith('image/')) {
            console.log(`Processing ${file.name} with Gemini Vision`);
            const base64Image = await api.fileToBase64(file);
            const prompt = "Extract all text content from this image, maintaining the original formatting as much as possible. If there are tables, please format them properly. If there are multiple columns, preserve the column structure.";
            
            const geminiResponse = await api.processImageWithGemini(prompt, base64Image, file.type);
            
            if (geminiResponse.success) {
              geminiResults.push({
                fileName: file.name,
                extractedText: geminiResponse.data,
                processed: true
              });
              console.log(`✅ Successfully processed ${file.name} with Gemini Vision`);
            } else {
              console.error(`❌ Failed to process ${file.name} with Gemini Vision:`, geminiResponse.error);
            }
          }
        } catch (error) {
          console.error("Gemini OCR processing error:", error);
        }
      }
      
      // If we have Gemini results, add them to the processed data
      if (geminiResults.length > 0) {
        return {
          processingId: data.processingId || `gemini-ocr-${Date.now()}`,
          fileIds,
          ocrApplied: true,
          ocrSettings,
          geminiResults,
          extractedTextContent: geminiResults.map(r => r.extractedText).join('\n\n'),
          ocrProvider: "gemini"
        };
      } else {
        console.log("No Gemini results, falling back to standard OCR");
      }
    }
    
    // Fall back to regular OCR API if Gemini processing failed or wasn't applicable
    console.log("Using standard OCR processing");
    response = await api.processFile(
      fileIds, 
      'table_extraction', 
      { 
        ocrSettings, 
        ...options 
      }
    );
    
    if (!response.success) {
      throw new Error(response.error || "OCR processing failed");
    }
    
    return {
      processingId: response.data?.processingId,
      fileIds,
      ocrApplied: true,
      ocrSettings,
      ocrProvider: "standard"
    };
  }
  
  canProcess(data: any): boolean {
    // Can process if we have file IDs and at least one is a document
    return (
      data && 
      (
        (data.fileIds && Array.isArray(data.fileIds) && data.fileIds.length > 0) ||
        (data.fileObjects && Array.isArray(data.fileObjects) && data.fileObjects.length > 0)
      ) &&
      (data.fileTypes?.documents > 0 || data.fileTypes?.images > 0) // Process documents or images
    );
  }
  
  private extractInputData(data: any, context?: ProcessingContext) {
    const fileIds = data.fileIds || [];
    const options = context?.options || {};
    
    return { fileIds, options };
  }
}
