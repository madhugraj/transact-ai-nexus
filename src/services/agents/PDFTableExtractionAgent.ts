
import { Agent, ProcessingContext } from "./types";
import * as api from '@/services/api';

export class PDFTableExtractionAgent implements Agent {
  id: string = "PDFTableExtraction";
  name: string = "PDF Table Extraction Agent";
  description: string = "Extracts tables from PDF documents";
  
  async process(data: any, context?: ProcessingContext): Promise<any> {
    // Extract processing ID from OCR agent or from input
    const processingId = data.processingId || context?.processingId;
    
    if (!processingId) {
      throw new Error("No processing ID available for table extraction");
    }
    
    // Poll for extraction status
    const maxAttempts = 30;
    const pollingInterval = 2000; // 2 seconds
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statusResponse = await api.checkProcessingStatus(processingId);
      
      if (statusResponse.success) {
        if (statusResponse.data?.status === "completed") {
          return {
            ...data,
            tables: statusResponse.data?.tables || [],
            tableCount: statusResponse.data?.tables?.length || 0,
            extractionComplete: true
          };
        }
        
        if (statusResponse.data?.status === "failed") {
          throw new Error(statusResponse.data?.error || "Table extraction failed");
        }
      }
      
      // Wait before next polling attempt
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
    }
    
    throw new Error("Table extraction timed out");
  }
  
  canProcess(data: any): boolean {
    return data && data.processingId && data.ocrApplied;
  }
}
