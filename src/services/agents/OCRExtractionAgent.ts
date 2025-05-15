
import { Agent, ProcessingContext } from "./types";
import * as api from '@/services/api';

export class OCRExtractionAgent implements Agent {
  id: string = "OCRExtraction";
  name: string = "OCR Extraction Agent";
  description: string = "Extracts text from images and PDFs using OCR with Gemini Vision";
  
  async process(data: any, context?: ProcessingContext): Promise<any> {
    console.log("🤖 OCRExtractionAgent processing with data:", {
      processingId: data.processingId,
      fileIds: data.fileIds,
      fileObjectsCount: data.fileObjects ? data.fileObjects.length : 0,
      fileObjectsTypes: data.fileObjects ? data.fileObjects.map(f => f.type) : []
    });
    console.log("OCRExtractionAgent context:", context);
    console.log("Using Gemini:", Boolean(context?.options?.useGemini));
    
    // Extract file IDs and file objects
    const { fileIds, fileObjects } = data;
    const { options } = context || {};
    
    // Default OCR settings
    const ocrSettings = {
      enabled: true,
      enhanceResolution: true,
      language: "eng",
      useGemini: Boolean(context?.options?.useGemini),
      customPrompt: options?.ocrSettings?.customPrompt,
      ...options?.ocrSettings
    };
    
    console.log("OCR settings:", ocrSettings);
    console.log("File objects available:", Boolean(fileObjects && fileObjects.length > 0));
    
    let extractedTextContent = "";
    let geminiResults = [];
    
    // Check if we should use Gemini Vision for enhanced OCR
    if (ocrSettings.useGemini && fileObjects && fileObjects.length > 0) {
      console.log("🔍 Using Gemini Vision for OCR processing");
      
      // Process each file with Gemini Vision
      for (const file of fileObjects) {
        try {
          // Only process image files and PDFs with Gemini Vision
          console.log(`Processing file: ${file.name}, type: ${file.type}`);
          
          if (file.type.startsWith('image/') || file.type === 'application/pdf') {
            console.log(`Processing ${file.name} with Gemini Vision`);
            
            const base64Image = await api.fileToBase64(file);
            console.log(`Converted ${file.name} to base64, length: ${base64Image.length}`);
            
            // Use custom prompt if available
            const prompt = ocrSettings.customPrompt || `
You're an OCR assistant. Read this scanned document image and extract clean, structured text.
You are also an expert in extracting tables from scanned images.
If the image has Checks, Mention that it is a check image and extract the values accordingly.
Extract all clear tabular structures from the image.
Extract all possible tabular structures with data from the image
Extract the Headings of the table.
Avoid any logos or text not part of a structured document.
Maintain original formatting as much as possible.`;
            
            console.log(`Sending ${file.name} to Gemini Vision API with prompt: ${prompt}`);
            const geminiResponse = await api.processImageWithGemini(prompt, base64Image, file.type);
            
            console.log(`Gemini Vision API response for ${file.name}:`, {
              success: geminiResponse.success,
              dataLength: geminiResponse.data?.length
            });
            
            if (geminiResponse.success) {
              geminiResults.push({
                fileName: file.name,
                extractedText: geminiResponse.data,
                processed: true
              });
              
              // Append to overall extracted text
              extractedTextContent += geminiResponse.data + "\n\n";
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
    }
    
    // Return processed data including file objects for document preview
    return {
      processingId: data.processingId,
      fileIds: data.fileIds,
      fileObjects: data.fileObjects, // Pass through the file objects for document preview
      ocrApplied: Boolean(geminiResults.length > 0),
      ocrSettings,
      geminiResults: geminiResults.length > 0 ? geminiResults : undefined,
      extractedTextContent: extractedTextContent.length > 0 ? extractedTextContent : undefined,
      ocrProvider: geminiResults.length > 0 ? "gemini" : undefined,
      processedBy: 'OCRExtractionAgent'
    };
  }
  
  canProcess(data: any): boolean {
    const canProcess = (
      data && 
      (
        (data.fileIds && Array.isArray(data.fileIds) && data.fileIds.length > 0) ||
        (data.fileObjects && Array.isArray(data.fileObjects) && data.fileObjects.length > 0)
      )
    );
    
    console.log("OCRExtractionAgent.canProcess:", canProcess, {
      hasFileIds: Boolean(data?.fileIds?.length > 0),
      hasFileObjects: Boolean(data?.fileObjects?.length > 0),
      documents: data?.fileTypes?.documents,
      images: data?.fileTypes?.images
    });
    return canProcess;
  }
}
