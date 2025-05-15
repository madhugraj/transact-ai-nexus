
import { Agent, ProcessingContext } from "./types";
import * as api from '@/services/api';

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
    const customPrompt = context?.options?.ocrSettings?.customPrompt;
    console.log("Custom table extraction prompt available:", Boolean(customPrompt));
    
    // Use the tables extracted by previous agents if available
    const extractedTables = data.extractedTables || [];
    
    // If we already have tables, use those
    if (extractedTables.length > 0) {
      console.log("Using tables from previous agent:", {
        count: extractedTables.length,
        sample: extractedTables[0]?.headers
      });
      
      // Format the table data for UI display
      const tableData = {
        headers: extractedTables[0].headers,
        rows: extractedTables[0].rows,
        metadata: {
          totalRows: extractedTables[0].rows.length,
          confidence: extractedTables[0].confidence || 0.9,
          sourceFile: data.processingId || "unknown"
        }
      };
      
      return {
        ...data, 
        fileObjects, // PRESERVE FILE OBJECTS for document preview
        dynamicTableDetection: true,
        tableData: tableData,
        tableCount: extractedTables.length,
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
            const tableResponse = await api.extractTablesFromImageWithGemini(base64Image, file.type, customPrompt);
            
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
                    source: file.name
                  }],
                  tableCount: 1,
                  extractionComplete: true,
                  processedBy: 'DynamicTableDetectionAgent'
                };
              }
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
      const tableStructure = await this.extractTableFromText(data.extractedTextContent);
      
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
            confidence: 0.8
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
  
  private async extractTableFromText(text: string): Promise<{ headers: string[], rows: string[][], metadata: any } | null> {
    try {
      // Use Gemini to extract table structure from text
      const prompt = `
You're an OCR assistant. Read this text and extract clean, structured tabular data.
You are an expert in extracting tables from text content.
Instructions:
- Extract all clear tabular structures from the text.
- Extract the Headings of the table
- Output JSON only in the format:

\`\`\`json
{
  "found": true,
  "headers": ["Column1", "Column2", ...],
  "rows": [
    ["row1col1", "row1col2", ...],
    ["row2col1", "row2col2", ...],
    ...
  ]
}
\`\`\`

TEXT:
${text}`;

      // Call the Gemini API directly to extract tables - updated to use gemini-1.5-flash
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 4096
            }
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }
      
      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract JSON from response text
      const jsonMatch = responseText.match(/\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/);
      if (!jsonMatch) {
        return null;
      }
      
      const parsedData = JSON.parse(jsonMatch[0]);
      
      if (!parsedData.found) {
        return null;
      }
      
      return {
        headers: parsedData.headers || [],
        rows: parsedData.rows || [],
        metadata: {
          totalRows: (parsedData.rows || []).length,
          confidence: 0.8,
          sourceFile: "text-extraction"
        }
      };
    } catch (error) {
      console.error("Error extracting table from text:", error);
      return null;
    }
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
