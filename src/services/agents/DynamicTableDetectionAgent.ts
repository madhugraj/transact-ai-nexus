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
      hasTableData: Boolean(data.tableData)
    });
    
    // Important - keep file objects for document preview
    const fileObjects = data.fileObjects || [];
    
    // Check if we have extracted text content from Gemini
    const useGemini = context?.options?.useGemini || false;
    const hasGeminiResults = data.geminiResults && data.geminiResults.length > 0;
    const extractedText = data.extractedTextContent || "";
    
    console.log("DynamicTableDetectionAgent settings:", {
      useGemini, 
      hasGeminiResults,
      extractedTextLength: extractedText.length,
      fileObjectsCount: fileObjects.length
    });
    
    // Use the tables extracted by previous agents if available
    const extractedTables = data.extractedTables || [];
    
    // If we already have tables, use those
    if (extractedTables.length > 0) {
      console.log("Using tables from previous agent:", {
        count: extractedTables.length,
        sample: extractedTables[0]?.headers
      });
      
      // Format the table data for UI display - this is crucial for it to appear in the UI
      const tableData = {
        headers: extractedTables[0].headers,
        rows: extractedTables[0].rows,
        metadata: {
          totalRows: extractedTables[0].rows.length,
          confidence: extractedTables[0].confidence || 0.9,
          sourceFile: data.processingId || "unknown"
        }
      };
      
      console.log("Formatted table data for UI:", {
        headers: tableData.headers,
        rowCount: tableData.rows.length
      });
      
      return {
        ...data, 
        fileObjects, // PRESERVE FILE OBJECTS for document preview
        dynamicTableDetection: true,
        tableData: tableData, // Make sure this is properly formatted
        extractionComplete: true,
        processedBy: 'DynamicTableDetectionAgent'
      };
    }
    
    // If we have table data directly, use that
    if (data.tableData) {
      console.log("Using table data directly:", {
        headers: data.tableData.headers,
        rowCount: data.tableData.rows.length
      });
      
      return {
        ...data,
        fileObjects, // PRESERVE FILE OBJECTS for document preview
        dynamicTableDetection: true,
        extractionComplete: true,
        processedBy: 'DynamicTableDetectionAgent'
      };
    }
    
    // If we have text content and Gemini is enabled, try to extract tables from the text
    if (useGemini && extractedText.length > 0) {
      console.log("Using Gemini for table detection and analysis");
      
      try {
        // Generate insights from the extracted text using Gemini
        const insightsResponse = await api.generateInsightsWithGemini(
          extractedText,
          "Analyze this extracted text. Identify any tables or structured data. Generate insights about the financial information contained in this document."
        );
        
        console.log("Gemini insights response received:", {
          success: insightsResponse.success,
          hasData: Boolean(insightsResponse.data)
        });
        
        if (insightsResponse.success && insightsResponse.data) {
          // Try to detect table structure from the text using a structured approach
          const tableStructure = await this.extractTableFromText(extractedText);
          
          if (tableStructure && tableStructure.headers.length > 0) {
            console.log("Successfully extracted table structure from text");
            
            return {
              ...data,
              fileObjects, // PRESERVE FILE OBJECTS for document preview
              dynamicTableDetection: true,
              tableData: tableStructure,
              extractedTables: [{
                tableId: "table-gemini-extracted-1",
                headers: tableStructure.headers,
                rows: tableStructure.rows,
                confidence: 0.8
              }],
              insights: {
                summary: insightsResponse.data.summary,
                keyPoints: insightsResponse.data.keyPoints,
                rawInsights: insightsResponse.data.insights
              },
              extractionComplete: true,
              processedBy: 'DynamicTableDetectionAgent'
            };
          } else {
            console.log("No table structure detected in text, returning insights only");
            
            return {
              ...data,
              fileObjects, // PRESERVE FILE OBJECTS for document preview
              dynamicTableDetection: true,
              insights: {
                summary: insightsResponse.data.summary,
                keyPoints: insightsResponse.data.keyPoints,
                rawInsights: insightsResponse.data.insights
              },
              noTablesDetected: true,
              extractionComplete: true,
              processedBy: 'DynamicTableDetectionAgent'
            };
          }
        } else {
          console.error("Failed to generate insights:", insightsResponse.error);
        }
      } catch (error) {
        console.error("Failed to generate insights with Gemini:", error);
      }
    }
    
    // If all other attempts failed, let the user know
    console.log("No tables detected through any method");
    
    return {
      ...data, 
      fileObjects, // PRESERVE FILE OBJECTS for document preview
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
Extract table data from the following text. If there's a table structure, format it as a JSON object with 'headers' array and 'rows' array of arrays. 
If no clear table is found, respond with { "found": false }.

TEXT:
${text}

OUTPUT FORMAT:
{
  "found": true,
  "headers": ["Column1", "Column2", ...],
  "rows": [
    ["row1col1", "row1col2", ...],
    ["row2col1", "row2col2", ...],
    ...
  ]
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              topP: 0.95,
              topK: 40,
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
       (data.geminiResults && data.geminiResults.length > 0));
      
    console.log("DynamicTableDetectionAgent.canProcess:", canProcess, {
      hasExtractedTables: Boolean(data?.extractedTables),
      hasTableData: Boolean(data?.tableData),
      hasExtractedText: Boolean(data?.extractedTextContent),
      hasGeminiResults: Boolean(data?.geminiResults && data?.geminiResults.length > 0)
    });
    return canProcess;
  }
}
