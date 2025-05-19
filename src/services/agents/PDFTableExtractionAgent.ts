import { Agent, ProcessingContext } from "./types";
import * as api from '@/services/api';
import * as pdfjs from 'pdfjs-dist';
import { renderPageToImage, loadPdfDocument } from './pdf-extraction/pdfUtils';
import { extractTablesFromPageImage } from './pdf-extraction/tableParser';
import { consolidateTables } from './pdf-extraction/tableConsolidation';

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
      const pdf = await loadPdfDocument(arrayBuffer);
      const totalPages = pdf.numPages;
      
      console.log(`PDF has ${totalPages} pages. Processing each page individually.`);
      
      // Process each page
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        console.log(`Processing page ${pageNum} of ${totalPages}`);
        
        try {
          const page = await pdf.getPage(pageNum);
          
          // Render the page and convert to base64 image
          const base64Image = await renderPageToImage(page);
          
          // Extract tables from this page
          const pageTableData = await extractTablesFromPageImage(
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
      return consolidateTables(extractedTables, pdfFile.name);
      
    } catch (error) {
      console.error('Error processing PDF:', error);
      return [];
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
