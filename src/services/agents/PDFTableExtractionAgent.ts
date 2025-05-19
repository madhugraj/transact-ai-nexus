
import { Agent, ProcessingContext } from "./types";
import * as api from '@/services/api';
import * as pdfjs from 'pdfjs-dist';

// Set up PDF.js worker
// Use a more compatible way to load the worker
if (typeof window !== 'undefined') {
  const pdfjsWorker = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url);
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker.toString();
}

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
        
        // Process the PDF page by page
        const pdfTables = await this.extractTablesFromPDFByPage(pdfFile);
        if (pdfTables && pdfTables.length > 0) {
          extractedTables.push(...pdfTables);
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
  
  /**
   * Process a PDF file page by page
   */
  private async extractTablesFromPDFByPage(pdfFile: File): Promise<any[]> {
    const extractedTables: any[] = [];
    const arrayBuffer = await pdfFile.arrayBuffer();
    
    try {
      // Load the PDF document
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      
      console.log(`PDF has ${totalPages} pages. Processing each page individually.`);
      
      // Process each page
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        console.log(`Processing page ${pageNum} of ${totalPages}`);
        
        try {
          const page = await pdf.getPage(pageNum);
          
          // Render the page to a canvas
          const viewport = page.getViewport({ scale: 1.5 }); // Higher scale for better quality
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) {
            throw new Error('Could not create canvas context');
          }
          
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          
          // Convert canvas to base64 image
          const base64Image = canvas.toDataURL('image/png').split(',')[1];
          
          // Extract tables from this page
          const pageTableData = await this.extractTablesFromPageImage(
            base64Image, 
            pdfFile.name, 
            pageNum, 
            totalPages
          );
          
          if (pageTableData && pageTableData.length > 0) {
            extractedTables.push(...pageTableData);
          }
        } catch (pageError) {
          console.error(`Error processing page ${pageNum}:`, pageError);
          // Continue with next page even if this one fails
        }
      }
      
      // Consolidate tables from all pages if needed
      return this.consolidateTables(extractedTables, pdfFile.name);
      
    } catch (error) {
      console.error('Error processing PDF:', error);
      return [];
    }
  }
  
  /**
   * Extract tables from a single PDF page image
   */
  private async extractTablesFromPageImage(
    base64Image: string, 
    fileName: string, 
    pageNum: number, 
    totalPages: number
  ): Promise<any[]> {
    // Customize the prompt to indicate we're processing a single page
    const tablePrompt = `
Extract all tables from this document image (page ${pageNum} of ${totalPages}).
Format each table with proper column headers and rows.
Return tables in JSON format only.
`;

    try {
      const response = await api.processImageWithGemini(tablePrompt, base64Image, 'image/png');
      
      if (response.success && response.data) {
        console.log(`Successfully extracted content from page ${pageNum}`);
        
        // Parse the table data from the text response
        const tableData = await this.parseTableFromText(response.data);
        
        if (tableData) {
          return [{
            tableId: `pdf-table-p${pageNum}-${Date.now()}`,
            source: fileName,
            title: `Table from ${fileName} (Page ${pageNum})`,
            headers: tableData.headers,
            rows: tableData.rows,
            confidence: 0.9,
            pageNumber: pageNum
          }];
        }
      }
      
      return [];
    } catch (error) {
      console.error(`Error extracting tables from page ${pageNum}:`, error);
      return [];
    }
  }
  
  /**
   * Consolidate tables extracted from multiple pages
   */
  private consolidateTables(tables: any[], fileName: string): any[] {
    if (!tables || tables.length <= 1) {
      return tables;
    }
    
    console.log(`Consolidating ${tables.length} tables extracted from PDF`);
    
    // Group tables by similar headers
    const tableGroups: Record<string, any[]> = {};
    
    tables.forEach(table => {
      if (!table.headers || !table.rows) return;
      
      // Create a signature for the table based on headers
      const headerSignature = this.createHeaderSignature(table.headers);
      
      if (!tableGroups[headerSignature]) {
        tableGroups[headerSignature] = [];
      }
      
      tableGroups[headerSignature].push(table);
    });
    
    // Merge tables with similar headers
    const consolidatedTables: any[] = [];
    
    Object.keys(tableGroups).forEach(signature => {
      const tablesInGroup = tableGroups[signature];
      
      if (tablesInGroup.length === 1) {
        // Only one table with this header signature, no need to merge
        consolidatedTables.push(tablesInGroup[0]);
      } else {
        // Multiple tables with same headers, merge them
        const mergedTable = this.mergeTables(tablesInGroup, fileName);
        consolidatedTables.push(mergedTable);
      }
    });
    
    console.log(`Consolidated ${tables.length} tables into ${consolidatedTables.length} tables`);
    return consolidatedTables;
  }
  
  /**
   * Create a signature for table headers to identify similar tables
   */
  private createHeaderSignature(headers: string[]): string {
    return headers
      .map(header => header.trim().toLowerCase())
      .sort()
      .join('|');
  }
  
  /**
   * Merge multiple tables with similar headers
   */
  private mergeTables(tables: any[], fileName: string): any {
    // Use the headers from the first table
    const headers = tables[0].headers;
    
    // Combine all rows from all tables
    const allRows: string[][] = [];
    const pageNumbers: number[] = [];
    
    tables.forEach(table => {
      allRows.push(...table.rows);
      if (table.pageNumber) {
        pageNumbers.push(table.pageNumber);
      }
    });
    
    // Sort page numbers for the title
    pageNumbers.sort((a, b) => a - b);
    const pageRangeStr = pageNumbers.length > 0 
      ? `(Pages ${pageNumbers[0]}-${pageNumbers[pageNumbers.length - 1]})`
      : '';
    
    return {
      tableId: `pdf-merged-table-${Date.now()}`,
      source: fileName,
      title: `Table from ${fileName} ${pageRangeStr}`,
      headers: headers,
      rows: allRows,
      confidence: 0.85,
      mergedFromPages: pageNumbers
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
