
import { Agent, ProcessingContext } from "./types";

// Define an interface for the UI data to fix TypeScript errors
interface UIData {
  processingId: string;
  fileIds: string[];
  fileObjects?: any[];
  tableCount: number;
  extractionComplete: boolean;
  processingComplete: boolean;
  usingGemini: boolean;
  timestamp: string;
  insights?: any;
  extractedText?: string;
  aiProvider?: string;
  geminiResults?: any[];
  tableData?: any;
  extractedTables?: any[];
}

export class DisplayAgent implements Agent {
  id: string = "DisplayAgent";
  name: string = "Display Agent";
  description: string = "Prepares processed data for display in the UI";
  
  async process(data: any, context?: ProcessingContext): Promise<any> {
    console.log("🤖 DisplayAgent preparing results for UI", { 
      processingId: data.processingId,
      hasGeminiResults: data.geminiResults && data.geminiResults.length > 0,
      hasTableData: Boolean(data.tableData),
      hasExtractedTables: data.extractedTables && data.extractedTables.length > 0,
      hasFileObjects: data.fileObjects && data.fileObjects.length > 0
    });
    
    // Log detailed table information for debugging
    if (data.tableData) {
      console.log("Table data received:", {
        headers: data.tableData.headers,
        rowCount: data.tableData.rows.length
      });
    }
    
    if (data.extractedTables && data.extractedTables.length > 0) {
      console.log("Extracted tables received:", {
        count: data.extractedTables.length,
        sample: {
          headers: data.extractedTables[0].headers,
          rowCount: data.extractedTables[0].rows.length
        }
      });
    }
    
    // Log file objects information
    if (data.fileObjects && data.fileObjects.length > 0) {
      console.log("File objects received:", {
        count: data.fileObjects.length,
        types: data.fileObjects.map(f => f.type),
        names: data.fileObjects.map(f => f.name)
      });
    }
    
    // Get file IDs and other metadata
    const processingId = data.processingId || `display-${Date.now()}`;
    const fileIds = data.fileIds || [];
    const geminiResults = data.geminiResults || [];
    const insights = data.insights || {};
    
    // Count tables if available
    const tableCount = data.extractedTables ? data.extractedTables.length : 
                      (data.tables && Array.isArray(data.tables)) ? data.tables.length : 0;
    
    // Check if we used Gemini
    const usingGemini = Boolean(geminiResults.length > 0 || data.ocrProvider === "gemini");
    
    // Basic UI metadata with proper typing
    const uiData: UIData = {
      processingId,
      fileIds,
      fileObjects: data.fileObjects, // CRITICALLY IMPORTANT to pass through file objects
      tableCount,
      extractionComplete: data.extractionComplete || false,
      processingComplete: true,
      usingGemini: usingGemini,
      timestamp: new Date().toISOString(),
    };
    
    // Add insights if available
    if (insights && Object.keys(insights).length > 0) {
      uiData.insights = insights;
    }
    
    // Add extracted text if available
    if (data.extractedTextContent) {
      uiData.extractedText = data.extractedTextContent;
    }
    
    // Add table data if available - IMPORTANT for UI display
    if (data.tableData) {
      uiData.tableData = data.tableData;
      console.log("Table data being passed to UI:", {
        headers: data.tableData.headers,
        rowCount: data.tableData.rows.length
      });
    }
    
    // Add extracted tables if available
    if (data.extractedTables && data.extractedTables.length > 0) {
      uiData.extractedTables = data.extractedTables;
      console.log("Extracted tables being passed to UI:", {
        count: data.extractedTables.length,
        sample: {
          headers: data.extractedTables[0].headers,
          rowCount: data.extractedTables[0].rows.length
        }
      });
    } else if (data.tables && data.tables.length > 0) {
      uiData.extractedTables = data.tables;
    }
    
    // Add gemini results if available
    if (usingGemini) {
      uiData.aiProvider = "Gemini";
      
      if (geminiResults.length > 0) {
        uiData.geminiResults = geminiResults;
      }
    }
    
    console.log("✅ DisplayAgent completed processing", { 
      processingId: uiData.processingId,
      tableCount: uiData.tableCount,
      hasExtractedText: Boolean(uiData.extractedText),
      hasInsights: Boolean(uiData.insights),
      hasTableData: Boolean(uiData.tableData),
      hasFileObjects: Boolean(uiData.fileObjects && uiData.fileObjects.length)
    });
    
    return uiData;
  }
  
  canProcess(data: any): boolean {
    // Can process any data that has reached this point in the pipeline
    return data != null;
  }
}
