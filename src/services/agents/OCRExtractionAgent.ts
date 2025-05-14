
import { Agent, ProcessingContext } from "./types";
import * as api from '@/services/api';

export class OCRExtractionAgent implements Agent {
  id: string = "OCRExtraction";
  name: string = "OCR Extraction Agent";
  description: string = "Extracts text from images and PDFs using OCR with Gemini Vision";
  
  async process(data: any, context?: ProcessingContext): Promise<any> {
    console.log("🤖 OCRExtractionAgent processing with data:", JSON.stringify(data, null, 2));
    console.log("OCRExtractionAgent context:", context);
    console.log("Using Gemini:", context?.options?.useGemini);
    
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
    
    console.log("OCR settings:", ocrSettings);
    console.log("File objects available:", Boolean(data.fileObjects && data.fileObjects.length > 0));
    
    let response;
    
    // Check if we should use Gemini Vision for enhanced OCR
    if (ocrSettings.useGemini && data.fileObjects && data.fileObjects.length > 0) {
      console.log("🔍 Using Gemini Vision for OCR processing");
      // Process each file with Gemini Vision
      const geminiResults = [];
      
      for (const file of data.fileObjects) {
        try {
          // Only process image files with Gemini Vision
          console.log(`Processing file: ${file.name}, type: ${file.type}`);
          
          if (file.type.startsWith('image/') || file.type === 'application/pdf') {
            console.log(`Processing ${file.name} with Gemini Vision`);
            
            // For PDF files, we'd need to convert them to images first
            // For this implementation, we'll just handle them directly
            const base64Image = await api.fileToBase64(file);
            console.log(`Converted ${file.name} to base64, length: ${base64Image.length}`);
            
            const prompt = "Extract all text content from this image, maintaining the original formatting as much as possible. If there are tables, please format them properly. If there are multiple columns, preserve the column structure.";
            
            console.log(`Sending ${file.name} to Gemini Vision API with prompt: ${prompt}`);
            const geminiResponse = await api.processImageWithGemini(prompt, base64Image, file.type);
            
            console.log(`Gemini Vision API response for ${file.name}:`, geminiResponse);
            
            if (geminiResponse.success) {
              geminiResults.push({
                fileName: file.name,
                extractedText: geminiResponse.data,
                processed: true
              });
              console.log(`✅ Successfully processed ${file.name} with Gemini Vision`);
            } else {
              console.error(`❌ Failed to process ${file.name} with Gemini Vision:`, geminiResponse.error);
              // Still add to results but mark as failed
              geminiResults.push({
                fileName: file.name,
                error: geminiResponse.error,
                processed: false
              });
            }
          } else {
            console.log(`Skipping ${file.name} as it's not an image or PDF (type: ${file.type})`);
          }
        } catch (error) {
          console.error("Gemini OCR processing error:", error);
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          geminiResults.push({
            fileName: file.name, 
            error: errorMessage,
            processed: false
          });
        }
      }
      
      console.log("Gemini processing results:", geminiResults);
      
      // If we have Gemini results, add them to the processed data
      if (geminiResults.length > 0) {
        console.log("Returning Gemini OCR results");
        return {
          processingId: data.processingId || `gemini-ocr-${Date.now()}`,
          fileIds,
          ocrApplied: true,
          ocrSettings,
          geminiResults,
          extractedTextContent: geminiResults
            .filter(r => r.processed)
            .map(r => r.extractedText)
            .join('\n\n'),
          ocrProvider: "gemini"
        };
      } else {
        console.log("No Gemini results, falling back to standard OCR");
      }
    }
    
    // Fall back to regular OCR API if Gemini processing failed or wasn't applicable
    console.log("Using standard OCR processing");
    
    try {
      response = await api.processFile(
        fileIds, 
        'table_extraction', 
        { 
          ocrSettings, 
          ...options 
        }
      );
      
      console.log("Standard OCR API response:", response);
      
      if (!response.success) {
        throw new Error(response.error || "OCR processing failed");
      }
      
      // For demo purposes, add some mock extracted text
      const mockExtractedText = "This is sample extracted text from OCR processing.\n\nIt would contain paragraphs, tables, and other content from the document.";
      
      return {
        processingId: response.data?.processingId,
        fileIds,
        ocrApplied: true,
        ocrSettings,
        ocrProvider: "standard",
        extractedTextContent: mockExtractedText
      };
    } catch (error) {
      console.error("Standard OCR processing error:", error);
      throw error;
    }
  }
  
  canProcess(data: any): boolean {
    const canProcess = (
      data && 
      (
        (data.fileIds && Array.isArray(data.fileIds) && data.fileIds.length > 0) ||
        (data.fileObjects && Array.isArray(data.fileObjects) && data.fileObjects.length > 0)
      ) &&
      (data.fileTypes?.documents > 0 || data.fileTypes?.images > 0) // Process documents or images
    );
    
    console.log("OCRExtractionAgent.canProcess:", canProcess);
    return canProcess;
  }
  
  private extractInputData(data: any, context?: ProcessingContext) {
    const fileIds = data.fileIds || [];
    const options = context?.options || {};
    
    return { fileIds, options };
  }
}
