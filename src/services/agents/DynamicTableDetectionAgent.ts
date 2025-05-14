
import { Agent, ProcessingContext } from "./types";
import * as api from '@/services/api';

export class DynamicTableDetectionAgent implements Agent {
  id: string = "DynamicTableDetection";
  name: string = "Dynamic Table Detection Agent";
  description: string = "Identifies and normalizes table structures using Gemini AI";
  
  async process(data: any, context?: ProcessingContext): Promise<any> {
    // Get extracted tables from previous agent or OCR text
    const tables = data.tables || [];
    const extractedTextContent = data.extractedTextContent || "";
    
    if (!tables.length && !extractedTextContent) {
      return {
        ...data,
        normalizedTables: [],
        detectedStructures: []
      };
    }
    
    // If we have tables already, normalize them
    if (tables.length > 0) {
      // Process each table for structure detection
      const normalizedTables = tables.map(table => this.normalizeTable(table));
      
      // Try to enhance table understanding with Gemini if possible
      let enhancedTables = normalizedTables;
      
      try {
        if (data.ocrProvider === "gemini" || (context?.options?.useGemini && extractedTextContent)) {
          enhancedTables = await this.enhanceTablesWithGemini(normalizedTables, extractedTextContent);
        }
      } catch (error) {
        console.error("Error enhancing tables with Gemini:", error);
      }
      
      // Detect common structures across tables
      const detectedStructures = this.detectCommonStructures(enhancedTables);
      
      return {
        ...data,
        normalizedTables: enhancedTables,
        detectedStructures,
        structureMetadata: {
          columnCount: this.getAverageColumnCount(enhancedTables),
          consistentHeaders: this.hasConsistentHeaders(enhancedTables),
          dataTypes: this.detectDataTypes(enhancedTables)
        }
      };
    }
    
    // If we only have extracted text from Gemini OCR, try to extract tables from it
    if (extractedTextContent && data.ocrProvider === "gemini") {
      try {
        const prompt = `
          Extract all tables from the following text and convert them to structured data.
          For each table, identify the headers and rows. If there are multiple tables, separate them clearly.
          Format your response as JSON with the following structure:
          
          {
            "tables": [
              {
                "headers": ["Header1", "Header2", ...],
                "rows": [
                  ["Row1Col1", "Row1Col2", ...],
                  ["Row2Col1", "Row2Col2", ...]
                ]
              }
            ]
          }
          
          Here is the text to process:
          
          ${extractedTextContent}
        `;
        
        const geminiResponse = await api.processTextWithGemini(prompt);
        
        if (geminiResponse.success && geminiResponse.data) {
          // Try to parse the response as JSON
          try {
            const parsedResponse = JSON.parse(geminiResponse.data);
            
            if (parsedResponse.tables && Array.isArray(parsedResponse.tables)) {
              const extractedTables = parsedResponse.tables;
              
              // Process each extracted table
              const normalizedTables = extractedTables.map(table => ({
                ...table,
                metadata: {
                  columnCount: table.headers?.length || 0,
                  rowCount: table.rows?.length || 0,
                  hasHeaders: Boolean(table.headers?.length),
                  headers: table.headers || []
                }
              }));
              
              // Detect common structures
              const detectedStructures = this.detectCommonStructures(normalizedTables);
              
              return {
                ...data,
                tables: extractedTables,
                tableCount: extractedTables.length,
                normalizedTables,
                detectedStructures,
                structureMetadata: {
                  columnCount: this.getAverageColumnCount(normalizedTables),
                  consistentHeaders: this.hasConsistentHeaders(normalizedTables),
                  dataTypes: this.detectDataTypes(normalizedTables)
                },
                tableExtractionSource: "gemini"
              };
            }
          } catch (parseError) {
            console.error("Error parsing Gemini table extraction response:", parseError);
          }
        }
      } catch (error) {
        console.error("Error extracting tables with Gemini:", error);
      }
    }
    
    // Return original data if no tables could be extracted
    return {
      ...data,
      normalizedTables: [],
      detectedStructures: []
    };
  }
  
  canProcess(data: any): boolean {
    return data && (data.tables || data.extractionComplete || data.extractedTextContent);
  }
  
  private async enhanceTablesWithGemini(tables: any[], textContent: string): Promise<any[]> {
    if (tables.length === 0) return tables;
    
    try {
      const prompt = `
        I have extracted tables from a document. Please analyze these tables and enhance their structure.
        Identify data types for each column, suggest better column names if the current ones are unclear,
        and identify any relationships between tables if multiple tables are present.
        
        Here are the tables I've extracted:
        ${JSON.stringify(tables, null, 2)}
        
        And here is the original text content:
        ${textContent.substring(0, 1000)}... (truncated)
        
        Format your response as JSON with the following structure:
        {
          "enhancedTables": [
            {
              "headers": ["EnhancedHeader1", "EnhancedHeader2", ...],
              "rows": [...],
              "dataTypes": ["string", "number", ...],
              "metadata": { ... }
            }
          ]
        }
      `;
      
      const geminiResponse = await api.processTextWithGemini(prompt);
      
      if (geminiResponse.success && geminiResponse.data) {
        try {
          const parsedResponse = JSON.parse(geminiResponse.data);
          
          if (parsedResponse.enhancedTables && Array.isArray(parsedResponse.enhancedTables)) {
            return parsedResponse.enhancedTables;
          }
        } catch (parseError) {
          console.error("Error parsing Gemini table enhancement response:", parseError);
        }
      }
    } catch (error) {
      console.error("Error enhancing tables with Gemini:", error);
    }
    
    return tables;
  }
  
  private normalizeTable(table: any) {
    // In real implementation, this would normalize table structure
    // For now, just pass through with metadata
    return {
      ...table,
      metadata: {
        columnCount: table.columns?.length || table.headers?.length || 0,
        rowCount: table.rows?.length || 0,
        hasHeaders: Boolean(table.headers?.length),
        headers: table.headers || []
      }
    };
  }
  
  private detectCommonStructures(tables: any[]) {
    // This would identify similar structures across tables
    // Simplified implementation for now
    const structures = [];
    
    if (tables.length > 0) {
      structures.push({
        type: "standard",
        columnCount: this.getAverageColumnCount(tables)
      });
    }
    
    return structures;
  }
  
  private getAverageColumnCount(tables: any[]) {
    if (tables.length === 0) return 0;
    const sum = tables.reduce((acc, table) => acc + (table.metadata?.columnCount || 0), 0);
    return Math.round(sum / tables.length);
  }
  
  private hasConsistentHeaders(tables: any[]) {
    if (tables.length <= 1) return true;
    
    // Compare headers of first table with others
    const firstHeaders = tables[0].metadata?.headers || [];
    return tables.every(table => {
      const headers = table.metadata?.headers || [];
      if (headers.length !== firstHeaders.length) return false;
      
      // Simplified comparison - in real implementation, would be more sophisticated
      return headers.length === firstHeaders.length;
    });
  }
  
  private detectDataTypes(tables: any[]) {
    // Simplified implementation for detecting common data types
    const types = {
      numeric: false,
      date: false,
      text: false
    };
    
    // In real implementation, would analyze cell contents
    types.text = true;
    
    return types;
  }
}
