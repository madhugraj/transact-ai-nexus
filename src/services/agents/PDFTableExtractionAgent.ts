
import { Agent, ProcessingContext } from "./types";
import * as api from '@/services/api';

export class PDFTableExtractionAgent implements Agent {
  id: string = "PDFTableExtraction";
  name: string = "PDF Table Extraction Agent";
  description: string = "Extracts tables from PDF documents";
  
  async process(data: any, context?: ProcessingContext): Promise<any> {
    console.log("🤖 PDFTableExtractionAgent processing with data:", {
      processingId: data.processingId,
      fileIds: data.fileIds,
      fileObjectsCount: data.fileObjects ? data.fileObjects.length : 0,
      hasExtractedText: Boolean(data.extractedTextContent)
    });
    
    // Important - keep file objects for document preview
    const fileObjects = data.fileObjects || [];
    
    // Check if we have PDF files to process
    const pdfFiles = fileObjects.filter(file => 
      file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')
    );
    
    console.log(`PDFTableExtractionAgent found ${pdfFiles.length} PDF files to process`);
    
    if (pdfFiles.length === 0) {
      console.log("No PDF files to process, skipping PDFTableExtractionAgent");
      return {
        ...data,
        fileObjects, // Preserve file objects
        pdfTablesExtracted: false
      };
    }
    
    // Process PDF files to extract tables
    const extractedTables = [];
    
    for (const pdfFile of pdfFiles) {
      try {
        console.log(`Processing PDF: ${pdfFile.name}`);
        
        // Use the extracted text content if available
        const extractedText = data.extractedTextContent || "";
        
        if (extractedText) {
          console.log("Using extracted text to identify tables in PDF");
          
          // Use Gemini to identify and extract tables from the text
          const tablePrompt = "Identify any tables in this text and format them with proper column headers and rows. Maintain the original structure.";
          
          // Convert PDF to base64 for Gemini processing if needed
          const base64Data = await api.fileToBase64(pdfFile);
          const response = await api.processImageWithGemini(tablePrompt, base64Data, pdfFile.type);
          
          if (response.success && response.data) {
            console.log("Successfully extracted table content from PDF using Gemini");
            
            // Parse the table data from the text response
            const tableData = await this.parseTableFromText(response.data);
            
            if (tableData) {
              extractedTables.push({
                tableId: `pdf-table-${extractedTables.length + 1}`,
                source: pdfFile.name,
                title: `Table from ${pdfFile.name}`,
                headers: tableData.headers,
                rows: tableData.rows,
                confidence: 0.9
              });
            }
          } else {
            console.error("Failed to extract table from PDF:", response.error);
          }
        } else {
          console.log("No extracted text available, sending PDF directly to Gemini");
          
          // Direct PDF processing with Gemini Vision
          const tablePrompt = "Extract all tables from this document. Format each table with proper column headers and rows.";
          
          const base64Data = await api.fileToBase64(pdfFile);
          const response = await api.processImageWithGemini(tablePrompt, base64Data, pdfFile.type);
          
          if (response.success && response.data) {
            console.log("Successfully extracted table content from PDF using direct Gemini Vision");
            
            // Parse the table data from the text response
            const tableData = await this.parseTableFromText(response.data);
            
            if (tableData) {
              extractedTables.push({
                tableId: `pdf-table-${extractedTables.length + 1}`,
                source: pdfFile.name,
                title: `Table from ${pdfFile.name}`,
                headers: tableData.headers,
                rows: tableData.rows,
                confidence: 0.85
              });
            }
          } else {
            console.error("Failed to extract table from PDF using direct method:", response.error);
          }
        }
      } catch (error) {
        console.error(`Error processing PDF file ${pdfFile.name}:`, error);
      }
    }
    
    console.log(`Extracted ${extractedTables.length} tables from PDF files`);
    
    return {
      ...data,
      fileObjects, // Preserve file objects for document preview
      pdfTablesExtracted: extractedTables.length > 0,
      extractedTables: [...(data.extractedTables || []), ...extractedTables],
      processedBy: 'PDFTableExtractionAgent'
    };
  }
  
  private async parseTableFromText(text: string): Promise<{ headers: string[], rows: string[][] } | null> {
    try {
      // Use Gemini to parse text into a structured table
      const parsePrompt = `
Parse the following text into a structured table. 
Extract header row and data rows. 
Return ONLY a JSON object with this format:
{
  "headers": ["Header1", "Header2", ...],
  "rows": [
    ["row1col1", "row1col2", ...],
    ["row2col1", "row2col2", ...],
    ...
  ]
}

Here's the text to parse:
${text}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: parsePrompt }] }],
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
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract JSON from the response
      const jsonMatch = resultText.match(/\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/);
      if (!jsonMatch) {
        console.error("No valid JSON found in response");
        return null;
      }
      
      const tableData = JSON.parse(jsonMatch[0]);
      
      if (!tableData.headers || !tableData.rows || !Array.isArray(tableData.headers) || !Array.isArray(tableData.rows)) {
        console.error("Invalid table structure in response");
        return null;
      }
      
      return {
        headers: tableData.headers,
        rows: tableData.rows
      };
    } catch (error) {
      console.error("Error parsing table from text:", error);
      return null;
    }
  }
  
  canProcess(data: any): boolean {
    // Check if there are file objects and if any are PDFs
    const hasFileObjects = data && data.fileObjects && Array.isArray(data.fileObjects) && data.fileObjects.length > 0;
    
    if (!hasFileObjects) {
      return false;
    }
    
    const hasPdfFiles = data.fileObjects.some((file: any) => 
      file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')
    );
    
    console.log("PDFTableExtractionAgent.canProcess:", hasPdfFiles, {
      hasFileObjects,
      pdfFilesCount: hasFileObjects ? data.fileObjects.filter((file: any) => 
        file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')
      ).length : 0
    });
    
    return hasPdfFiles;
  }
}
