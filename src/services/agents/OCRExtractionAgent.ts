
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
      fileObjects: data.fileObjects ? data.fileObjects.length : 0,
      fileObjectsTypes: data.fileObjects ? data.fileObjects.map(f => f.type) : []
    });
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
      
      console.log("Gemini processing results:", geminiResults.map(r => ({
        fileName: r.fileName,
        processed: r.processed,
        textLength: r.extractedText?.length
      })));
      
      // If we have Gemini results, add them to the processed data
      if (geminiResults.length > 0) {
        console.log("Returning Gemini OCR results");
        return {
          processingId: data.processingId || `gemini-ocr-${Date.now()}`,
          fileIds,
          fileObjects: data.fileObjects, // Pass through the file objects
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
      // For demo, just create mock OCR data
      const mockExtractedText = data.fileObjects && data.fileObjects.length > 0 
        ? `Sample Bank Statement
Account Number: XXXX-XXXX-1234
Statement Period: 01/25/2023 - 02/25/2023

Transaction History:
Date       | Description           | Amount    | Balance
-----------|-----------------------|-----------|----------
01/27/2023 | GROCERY STORE         | -$125.65  | $3,245.89
01/30/2023 | DIRECT DEPOSIT SALARY | +$2,450.00| $5,695.89
02/03/2023 | RENT PAYMENT          | -$1,800.00| $3,895.89
02/10/2023 | ONLINE PURCHASE       | -$79.99   | $3,815.90
02/15/2023 | RESTAURANT            | -$65.43   | $3,750.47
02/20/2023 | UTILITY BILL          | -$124.56  | $3,625.91

Account Summary:
Starting Balance: $3,371.54
Total Deposits: $2,450.00
Total Withdrawals: $2,195.63
Ending Balance: $3,625.91`
        : "No file content available for OCR processing";
      
      console.log("✅ Standard OCR processing complete with mock data");
      
      return {
        processingId: data.processingId,
        fileIds,
        fileObjects: data.fileObjects, // Pass through the file objects
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
    
    console.log("OCRExtractionAgent.canProcess:", canProcess, {
      hasFileIds: Boolean(data?.fileIds?.length > 0),
      hasFileObjects: Boolean(data?.fileObjects?.length > 0),
      documents: data?.fileTypes?.documents,
      images: data?.fileTypes?.images
    });
    return canProcess;
  }
  
  private extractInputData(data: any, context?: ProcessingContext) {
    const fileIds = data.fileIds || [];
    const options = context?.options || {};
    
    return { fileIds, options };
  }
}
