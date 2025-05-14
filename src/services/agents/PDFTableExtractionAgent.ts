
import { Agent, ProcessingContext } from "./types";
import * as api from '@/services/api';

export class PDFTableExtractionAgent implements Agent {
  id: string = "PDFTableExtraction";
  name: string = "PDF Table Extraction Agent";
  description: string = "Extracts tables from PDF documents";
  
  async process(data: any, context?: ProcessingContext): Promise<any> {
    console.log("🔍 PDFTableExtractionAgent processing started", { 
      processingId: data.processingId,
      fileIds: data.fileIds,
      context
    });
    
    // Extract processing ID from OCR agent or from input
    const processingId = data.processingId || context?.processingId;
    
    if (!processingId) {
      console.error("No processing ID available for table extraction");
      throw new Error("No processing ID available for table extraction");
    }
    
    try {
      // In a real implementation, we would call a backend service 
      // that processes the PDF and extracts tables
      
      // For now, simulate a successful extraction with mock data
      const mockExtractedTables = [
        {
          tableId: "table-1",
          headers: ["Date", "Description", "Amount", "Balance"],
          rows: [
            ["2025-05-01", "Direct Deposit", "+$2,450.00", "$5,678.90"],
            ["2025-05-02", "ATM Withdrawal", "-$100.00", "$5,578.90"],
            ["2025-05-03", "Online Payment", "-$245.67", "$5,333.23"],
            ["2025-05-05", "Check #1234", "-$1,200.00", "$4,133.23"]
          ],
          confidence: 0.92
        }
      ];
      
      console.log("✅ PDFTableExtractionAgent completed processing", {
        extractedTables: mockExtractedTables,
        tablesCount: mockExtractedTables.length
      });
      
      return {
        ...data,
        tables: mockExtractedTables,
        tableCount: mockExtractedTables.length,
        extractionComplete: true,
        processingComplete: true,
        extractedTextContent: data.extractedTextContent || "Sample extracted text content from the document."
      };
    } catch (error) {
      console.error("❌ PDFTableExtractionAgent error:", error);
      throw error;
    }
  }
  
  canProcess(data: any): boolean {
    const canProcess = data && data.processingId && data.ocrApplied;
    console.log("PDFTableExtractionAgent.canProcess:", canProcess, {
      hasProcessingId: Boolean(data?.processingId),
      isOcrApplied: Boolean(data?.ocrApplied)
    });
    return canProcess;
  }
}
