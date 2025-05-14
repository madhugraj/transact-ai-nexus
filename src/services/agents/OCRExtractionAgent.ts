
import { Agent, ProcessingContext } from "./types";
import * as api from '@/services/api';

export class OCRExtractionAgent implements Agent {
  id: string = "OCRExtraction";
  name: string = "OCR Extraction Agent";
  description: string = "Extracts text from images and PDFs using OCR";
  
  async process(data: any, context?: ProcessingContext): Promise<any> {
    // Extract file IDs from previous agent
    const { fileIds, options } = this.extractInputData(data, context);
    
    // Default OCR settings
    const ocrSettings = {
      enabled: true,
      enhanceResolution: true,
      language: "eng",
      ...options?.ocrSettings
    };
    
    // Call the OCR API
    const response = await api.processFile(
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
      ocrSettings
    };
  }
  
  canProcess(data: any): boolean {
    // Can process if we have file IDs and at least one is a document
    return (
      data && 
      data.fileIds && 
      Array.isArray(data.fileIds) && 
      data.fileIds.length > 0 &&
      (data.fileTypes?.documents > 0) // Only process if we have documents
    );
  }
  
  private extractInputData(data: any, context?: ProcessingContext) {
    const fileIds = data.fileIds || [];
    const options = context?.options || {};
    
    return { fileIds, options };
  }
}
