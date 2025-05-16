
import { Agent, ProcessingContext } from "./types";
import * as api from '@/services/api';
import { PDFDocument } from 'pdf-lib';

export class PDFTableExtractionAgent implements Agent {
  id: string = "PDFTableExtraction";
  name: string = "PDF Table Extraction Agent";
  description: string = "Extracts tables from PDF documents page by page";
  
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
    const failedPages = [];
    
    for (const pdfFile of pdfFiles) {
      try {
        console.log(`Processing PDF: ${pdfFile.name}`);
        
        // Convert PDF to ArrayBuffer for processing with pdf-lib
        const pdfArrayBuffer = await this.fileToArrayBuffer(pdfFile);
        
        // Load the PDF document
        const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
        const pageCount = pdfDoc.getPageCount();
        
        console.log(`PDF has ${pageCount} pages, processing each page individually`);
        
        // First try direct text-based table extraction if available (simulating pdfplumber approach)
        let directExtractionSucceeded = false;
        
        // If we have extracted text content, try to parse tables from it
        if (data.extractedTextContent) {
          try {
            console.log("Attempting direct table extraction from extracted text content");
            const parsedTables = await this.extractTablesFromText(data.extractedTextContent);
            
            if (parsedTables && parsedTables.length > 0) {
              console.log(`Successfully extracted ${parsedTables.length} tables directly from text`);
              extractedTables.push(...parsedTables.map((table, idx) => ({
                tableId: `pdf-text-table-${pdfFile.name}-${idx + 1}`,
                source: `${pdfFile.name} (Text extraction)`,
                title: `${table.title || `Extracted Table from ${pdfFile.name}`}`,
                headers: table.headers,
                rows: table.rows,
                confidence: 0.95
              })));
              directExtractionSucceeded = true;
            }
          } catch (textExtractionError) {
            console.error("Error extracting tables from text:", textExtractionError);
            // Fall back to page-by-page Gemini Vision extraction
          }
        }
        
        // If direct extraction failed or we want additional tables, process each page with Gemini Vision
        if (!directExtractionSucceeded || extractedTables.length === 0) {
          // Process each page separately
          for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
            console.log(`Processing page ${pageIndex + 1} of ${pageCount}`);
            
            try {
              // Create a new document with just this page
              const singlePageDoc = await PDFDocument.create();
              const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [pageIndex]);
              singlePageDoc.addPage(copiedPage);
              
              // Convert single page PDF to base64
              const singlePageBytes = await singlePageDoc.save();
              const base64Data = this.arrayBufferToBase64(singlePageBytes);
              
              // Use updated prompt template that exactly matches the required format
              const tablePrompt = `You are an expert in extracting tables from scanned images.
If the image has Checks, Mention that it is a check image and extract the values accordingly.
- Give appropriate title for the image according to the type of image.
Instructions:
- Extract all clear tabular structures from the image.
- Extract all possible tabular structures with data from the image
- Avoid any logos or text not part of a structured table.
- Output JSON only in the format:

\`\`\`json
{
  "tables": [
    {
      "title": "optional title",
      "headers": ["Column A", "Column B"],
      "rows": [
        ["value1", "value2"],
        ...
      ]
    }
  ]
}
\`\`\``;
              
              // Process each page with Gemini Vision
              const response = await api.processImageWithGemini(
                tablePrompt,
                base64Data,
                'application/pdf'
              );
              
              if (response.success && response.data) {
                console.log(`Successfully extracted content from page ${pageIndex + 1}`);
                
                // Try to extract JSON from the response
                try {
                  const jsonMatch = response.data.match(/```json\s*(\{[\s\S]*?\})\s*```/) || 
                                  response.data.match(/\{[\s\S]*"tables"[\s\S]*\}/);
                                  
                  if (jsonMatch) {
                    const jsonStr = jsonMatch[1] || jsonMatch[0];
                    const parsedData = JSON.parse(jsonStr);
                    
                    if (parsedData.tables && Array.isArray(parsedData.tables)) {
                      console.log(`Found ${parsedData.tables.length} tables in page ${pageIndex + 1}`);
                      
                      // Add page number to title for better identification
                      parsedData.tables.forEach((table, tableIndex) => {
                        // Ensure we have a title
                        const baseTitle = table.title || `Table from ${pdfFile.name}`;
                        table.title = `${baseTitle} (Page ${pageIndex + 1}, Table ${tableIndex + 1})`;
                        
                        // Add to extracted tables
                        extractedTables.push({
                          tableId: `pdf-table-p${pageIndex + 1}-t${tableIndex + 1}`,
                          source: `${pdfFile.name} (Page ${pageIndex + 1})`,
                          title: table.title,
                          headers: table.headers,
                          rows: table.rows,
                          confidence: 0.9
                        });
                      });
                    }
                  } else {
                    console.log(`No valid JSON found in response for page ${pageIndex + 1}`);
                    // Try direct text-based table extraction as fallback
                    const extractedTable = await this.extractTableFromText(response.data);
                    if (extractedTable) {
                      extractedTables.push({
                        tableId: `pdf-table-p${pageIndex + 1}-fallback`,
                        source: `${pdfFile.name} (Page ${pageIndex + 1})`,
                        title: `Extracted Table from ${pdfFile.name} (Page ${pageIndex + 1})`,
                        headers: extractedTable.headers,
                        rows: extractedTable.rows,
                        confidence: 0.8
                      });
                    } else {
                      failedPages.push(pageIndex + 1);
                    }
                  }
                } catch (parseError) {
                  console.error(`Error parsing JSON from page ${pageIndex + 1}:`, parseError);
                  console.error("Raw response:", response.data.substring(0, 200) + "...");
                  failedPages.push(pageIndex + 1);
                }
              } else {
                console.error(`Failed to extract content from page ${pageIndex + 1}:`, response.error);
                failedPages.push(pageIndex + 1);
              }
            } catch (pageError) {
              console.error(`Error processing page ${pageIndex + 1}:`, pageError);
              failedPages.push(pageIndex + 1);
            }
          }
        }
      } catch (fileError) {
        console.error(`Error processing PDF file ${pdfFile.name}:`, fileError);
      }
    }
    
    if (failedPages.length > 0) {
      console.log(`Warning: Failed to extract tables from pages: ${failedPages.join(', ')}`);
    }
    
    console.log(`Extracted ${extractedTables.length} tables from PDF files`);
    
    return {
      ...data,
      fileObjects, // Preserve file objects for document preview
      pdfTablesExtracted: extractedTables.length > 0,
      extractedTables: [...(data.extractedTables || []), ...extractedTables],
      failedExtractedPages: failedPages,
      processedBy: 'PDFTableExtractionAgent'
    };
  }

  // Helper method to extract tables from text content (simulating pdfplumber functionality)
  private async extractTablesFromText(text: string): Promise<{title: string, headers: string[], rows: string[][]}[]> {
    try {
      // Use Gemini to parse text into structured tables
      const parsePrompt = `
I need you to extract ALL possible tables from the following text. Many tables may be present.
Extract each table with its headers and data rows.
Return ONLY a JSON object with this format:
{
  "tables": [
    {
      "title": "Table name or description",
      "headers": ["Header1", "Header2", ...],
      "rows": [
        ["row1col1", "row1col2", ...],
        ["row2col1", "row2col2", ...],
        ...
      ]
    },
    {
      "title": "Second table name",
      "headers": [...],
      "rows": [...]
    }
  ]
}

Only include clear tabular data. Here's the text:
${text.substring(0, 15000)}`; // Limit text length to avoid token limits

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk`,
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
        console.error("No valid JSON found in text extraction response");
        return [];
      }
      
      const parsedData = JSON.parse(jsonMatch[0]);
      
      if (!parsedData.tables || !Array.isArray(parsedData.tables) || parsedData.tables.length === 0) {
        console.log("No tables found in text extraction");
        return [];
      }
      
      // Validate each table has the required structure
      return parsedData.tables.filter(table => 
        table.headers && Array.isArray(table.headers) && 
        table.rows && Array.isArray(table.rows) && 
        table.rows.length > 0
      );
    } catch (error) {
      console.error("Error extracting tables from text:", error);
      return [];
    }
  }
  
  private async extractTableFromText(text: string): Promise<{ headers: string[], rows: string[][] } | null> {
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
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk`,
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
  
  private fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
  
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
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
