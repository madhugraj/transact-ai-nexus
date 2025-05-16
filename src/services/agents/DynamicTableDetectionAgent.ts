
import { Agent, ProcessingContext } from "./types";
import * as api from '@/services/api';
import { extractTableFromText } from "./tableDetection/textTableExtractor";

export class DynamicTableDetectionAgent implements Agent {
  id: string = "DynamicTableDetection";
  name: string = "Dynamic Table Detection Agent";
  description: string = "Detects and extracts tables from document content using AI";
  
  async process(data: any, context?: ProcessingContext): Promise<any> {
    console.log("🤖 DynamicTableDetectionAgent processing with data:", {
      processingId: data.processingId,
      fileIds: data.fileIds,
      hasGeminiResults: data.geminiResults && data.geminiResults.length > 0,
      extractedTextLength: data.extractedTextContent ? data.extractedTextContent.length : 0,
      hasExtractedTables: data.extractedTables ? data.extractedTables.length : 0,
      hasTableData: Boolean(data.tableData),
      hasFileObjects: Boolean(data.fileObjects && data.fileObjects.length > 0)
    });
    
    // Important - keep file objects for document preview
    const fileObjects = data.fileObjects || [];
    console.log("File objects available:", fileObjects.length);
    
    // Get custom prompt if available in processing options
    const customPrompt = context?.options?.ocrSettings?.customPrompt || '';
    console.log("Custom table extraction prompt available:", Boolean(customPrompt));
    
    // Use the tables extracted by previous agents if available
    const extractedTables = data.extractedTables || [];
    
    // If we already have tables or table data, use those
    if (extractedTables.length > 0 || data.tableData) {
      console.log("Using tables from previous agent:", {
        count: extractedTables.length,
        sample: extractedTables[0]?.headers || data.tableData?.headers
      });
      
      // Format the table data for UI display
      const tableData = data.tableData || {
        headers: extractedTables[0].headers,
        rows: extractedTables[0].rows,
        metadata: {
          totalRows: extractedTables[0].rows.length,
          confidence: extractedTables[0].confidence || 0.9,
          sourceFile: data.processingId || "unknown",
          title: extractedTables[0].title || "Extracted Table"
        }
      };
      
      return {
        ...data, 
        fileObjects, // PRESERVE FILE OBJECTS for document preview
        dynamicTableDetection: true,
        tableData: tableData,
        tableCount: extractedTables.length || 1,
        extractionComplete: true,
        processedBy: 'DynamicTableDetectionAgent'
      };
    }
    
    // If we have file objects, try to extract tables directly from files
    if (fileObjects.length > 0) {
      console.log("Attempting direct table extraction from files");
      
      for (const file of fileObjects) {
        try {
          if (file.type.startsWith('image/') || file.type === 'application/pdf') {
            console.log(`Processing ${file.name} for table extraction`);
            
            const base64Image = await api.fileToBase64(file);
            
            // Use the specialized table extraction function with custom prompt if available
            const tableResponse = await api.extractTablesFromImageWithGemini(
              base64Image, 
              file.type, 
              customPrompt
            );
            
            if (tableResponse.success && tableResponse.data) {
              console.log("Table extraction successful:", tableResponse.data);
              
              if (tableResponse.data.tables && tableResponse.data.tables.length > 0) {
                const extractedTable = tableResponse.data.tables[0];
                
                // Create properly formatted table data
                const tableData = {
                  headers: extractedTable.headers,
                  rows: extractedTable.rows,
                  metadata: {
                    totalRows: extractedTable.rows.length,
                    confidence: 0.9,
                    sourceFile: file.name,
                    title: extractedTable.title || `Table from ${file.name}`
                  }
                };
                
                console.log("Extracted table data:", {
                  headers: tableData.headers,
                  rowCount: tableData.rows.length,
                  title: tableData.metadata.title
                });
                
                return {
                  ...data,
                  fileObjects, // PRESERVE FILE OBJECTS for document preview
                  dynamicTableDetection: true,
                  tableData: tableData,
                  extractedTables: [{
                    tableId: `extracted-table-${file.name}`,
                    title: extractedTable.title || `Table from ${file.name}`,
                    headers: extractedTable.headers,
                    rows: extractedTable.rows,
                    confidence: 0.9,
                    source: file.name,
                    type: 'table' // Ensure type is set for AI Assistant
                  }],
                  tableCount: 1,
                  extractionComplete: true,
                  processedBy: 'DynamicTableDetectionAgent'
                };
              }
            } else {
              console.log("Table extraction failed:", tableResponse.error);
            }
          }
        } catch (error) {
          console.error(`Error extracting tables from ${file.name}:`, error);
        }
      }
    }
    
    // If we have text content, try to extract tables from the text
    if (data.extractedTextContent) {
      console.log("Attempting to extract tables from text content");
      const tableStructure = await extractTableFromText(data.extractedTextContent);
      
      if (tableStructure && tableStructure.headers.length > 0) {
        console.log("Successfully extracted table structure from text");
        
        return {
          ...data,
          fileObjects,
          dynamicTableDetection: true,
          tableData: tableStructure,
          extractedTables: [{
            tableId: "table-text-extracted-1",
            headers: tableStructure.headers,
            rows: tableStructure.rows,
            confidence: 0.8,
            type: 'table' // Ensure type is set for AI Assistant
          }],
          tableCount: 1,
          extractionComplete: true,
          processedBy: 'DynamicTableDetectionAgent'
        };
      }
    }
    
    // If all attempts failed, let the user know
    console.log("No tables detected through any method");
    
    return {
      ...data, 
      fileObjects,
      dynamicTableDetection: false,
      noTablesDetected: true,
      extractionComplete: true,
      processedBy: 'DynamicTableDetectionAgent'
    };
  }
  
  canProcess(data: any): boolean {
    const canProcess = data && 
      (data.extractedTables || data.tableData || data.extractedTextContent || 
       (data.geminiResults && data.geminiResults.length > 0) ||
       (data.fileObjects && data.fileObjects.length > 0));
      
    console.log("DynamicTableDetectionAgent.canProcess:", canProcess, {
      hasExtractedTables: Boolean(data?.extractedTables),
      hasTableData: Boolean(data?.tableData),
      hasExtractedText: Boolean(data?.extractedTextContent),
      hasGeminiResults: Boolean(data?.geminiResults && data?.geminiResults.length > 0),
      hasFileObjects: Boolean(data?.fileObjects && data?.fileObjects.length > 0)
    });
    return canProcess;
  }
}
