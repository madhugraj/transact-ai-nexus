import { Agent, ProcessingContext } from "./types";
import * as api from '@/services/api';
import { PDFDocument } from 'pdf-lib';
import { parseAITableOutput } from '@/utils/documentHelpers';

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
        
        // First try direct text-based table extraction if available
        let textExtractionComplete = false;
        
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
              textExtractionComplete = true;
            } else {
              console.log("No tables found in text, proceeding with page-by-page extraction");
            }
          } catch (textExtractionError) {
            console.error("Error extracting tables from text:", textExtractionError);
            // Fall back to page-by-page Vision extraction
          }
        }
        
        // Process each page separately regardless of text extraction results
        // This ensures we catch tables that might be missed by text extraction
        console.log(`Processing all ${pageCount} pages individually with Vision API for comprehensive extraction`);
        
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
            
            // Use improved prompt template for better extraction
            const tablePrompt = `You are an expert in extracting tables from PDF documents.
Your task is to extract ALL tables present on this page.

Instructions:
- Extract ALL tabular structures from the image, even if they look different from each other
- Include ALL rows and columns even if they span multiple sections
- For multiple tables, extract each one separately
- Give each table a descriptive title based on its content
- Ensure ALL data cells are included, don't skip any rows or columns
- Process the ENTIRE visible page content
- Label any tables that might be continuations from previous pages

Output format must be valid JSON with this exact structure:
\`\`\`json
{
  "tables": [
    {
      "title": "descriptive title of table",
      "headers": ["Header1", "Header2", "Header3", ...],
      "rows": [
        ["row1col1", "row1col2", "row1col3", ...],
        ["row2col1", "row2col2", "row2col3", ...],
        ...
      ]
    },
    {
      "title": "title of second table if present",
      "headers": [...],
      "rows": [...]
    }
  ]
}
\`\`\``;
              
            // Process each page with Vision API
            console.log(`Sending page ${pageIndex + 1} to Vision API`);
            const response = await api.processImageWithGemini(
              tablePrompt,
              base64Data,
              'application/pdf'
            );
            
            if (response.success && response.data) {
              console.log(`Successfully received response for page ${pageIndex + 1}`);
              
              // Parse tables from the response
              const parsedTables = parseAITableOutput(response.data);
              
              if (parsedTables && parsedTables.length > 0) {
                console.log(`Found ${parsedTables.length} tables in page ${pageIndex + 1}`);
                
                // Add all tables with page information
                parsedTables.forEach((table, tableIndex) => {
                  // Ensure we have a title
                  const baseTitle = table.title || `Table from ${pdfFile.name}`;
                  const fullTitle = `${baseTitle} (Page ${pageIndex + 1}, Table ${tableIndex + 1})`;
                  
                  // Add to extracted tables
                  extractedTables.push({
                    tableId: `pdf-table-p${pageIndex + 1}-t${tableIndex + 1}`,
                    source: `${pdfFile.name} (Page ${pageIndex + 1})`,
                    title: fullTitle,
                    headers: table.headers,
                    rows: table.rows,
                    confidence: 0.9
                  });
                });
              } else {
                console.log(`No valid tables found in page ${pageIndex + 1}`);
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

  // Helper method to extract tables from text content
  private async extractTablesFromText(text: string): Promise<{title: string, headers: string[], rows: string[][]}[]> {
    try {
      // Use Gemini to parse text into structured tables with a more comprehensive prompt
      const parsePrompt = `
I need you to extract ALL possible tables from the following text. There may be multiple tables in the text.
Look carefully through the ENTIRE text to identify and extract ALL tabular structures.

Instructions:
- Examine the entire text thoroughly for ANY tabular data
- Tables might have headers separated by spaces, tabs, or other delimiters
- Extract each table with its complete headers and ALL data rows
- Some tables may span multiple sections or have irregular formatting
- Skip any non-tabular content but capture ALL tables
- Assign a descriptive title to each table based on its context or content
- Don't miss any tables, even if they look different from each other

Return ONLY a JSON object with this exact format:
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

Here's the text to analyze:
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
              maxOutputTokens: 8192 // Increased output tokens for more comprehensive results
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }
      
      const data = await response.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract tables from the response
      return parseAITableOutput(resultText);
    } catch (error) {
      console.error("Error extracting tables from text:", error);
      return [];
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
