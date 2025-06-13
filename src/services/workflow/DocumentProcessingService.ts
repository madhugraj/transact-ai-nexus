
import { supabase } from '@/integrations/supabase/client';
import { InvoiceDataExtractionAgent } from '@/services/agents/InvoiceDataExtractionAgent';
import { InvoiceDetectionAgent } from '@/services/agents/InvoiceDetectionAgent';
import { PODetectionAgent } from '@/services/agents/PODetectionAgent';

export class DocumentProcessingService {
  private invoiceExtractionAgent: InvoiceDataExtractionAgent;
  private invoiceDetectionAgent: InvoiceDetectionAgent;
  private poDetectionAgent: PODetectionAgent;

  constructor() {
    this.invoiceExtractionAgent = new InvoiceDataExtractionAgent();
    this.invoiceDetectionAgent = new InvoiceDetectionAgent();
    this.poDetectionAgent = new PODetectionAgent();
  }

  async processDocuments(files: any[], processingType: string): Promise<any> {
    console.log('🔄 REAL Processing', files.length, 'documents with type:', processingType);
    
    if (!files || files.length === 0) {
      console.log('⚠️ No files provided for processing');
      return {
        processingType,
        extractedData: [],
        processedCount: 0,
        successCount: 0
      };
    }
    
    const extractedData = [];
    let successCount = 0;
    
    for (const file of files) {
      try {
        console.log('📄 REAL Processing file:', file.name || file.filename);
        
        // Convert file object to actual File if needed
        let fileObj = file;
        if (file.content && file.name) {
          // Convert base64 content to File object
          const response = await fetch(file.content);
          const blob = await response.blob();
          fileObj = new File([blob], file.name, { type: file.type || 'application/pdf' });
        }
        
        let result;
        
        switch (processingType) {
          case 'invoice-extraction':
            // First detect if it's an invoice
            const invoiceDetection = await this.invoiceDetectionAgent.process(fileObj);
            if (invoiceDetection.success && invoiceDetection.data?.is_invoice) {
              // Extract invoice data
              const extractionResult = await this.invoiceExtractionAgent.process(fileObj);
              if (extractionResult.success) {
                result = {
                  ...extractionResult.data,
                  fileName: file.name || file.filename,
                  source: file.source || 'workflow',
                  processedAt: new Date().toISOString(),
                  detection_confidence: invoiceDetection.data.confidence,
                  extraction_confidence: extractionResult.data?.extraction_confidence || 0.8
                };
                successCount++;
              } else {
                result = {
                  fileName: file.name || file.filename,
                  error: extractionResult.error || 'Invoice extraction failed',
                  processedAt: new Date().toISOString()
                };
              }
            } else {
              result = {
                fileName: file.name || file.filename,
                error: 'Document is not detected as an invoice',
                processedAt: new Date().toISOString(),
                detection_result: invoiceDetection.data
              };
            }
            break;
            
          case 'po-extraction':
            // Detect if it's a PO and extract data
            const poDetection = await this.poDetectionAgent.process(fileObj);
            if (poDetection.success && poDetection.data?.is_po) {
              // Use invoice extraction agent for PO data (since it can handle both)
              const extractionResult = await this.invoiceExtractionAgent.process(fileObj);
              if (extractionResult.success) {
                result = {
                  ...extractionResult.data,
                  fileName: file.name || file.filename,
                  source: file.source || 'workflow',
                  processedAt: new Date().toISOString(),
                  document_type: 'purchase_order',
                  detection_confidence: poDetection.data.confidence,
                  extraction_confidence: extractionResult.data?.extraction_confidence || 0.8
                };
                successCount++;
              } else {
                result = {
                  fileName: file.name || file.filename,
                  error: extractionResult.error || 'PO extraction failed',
                  processedAt: new Date().toISOString()
                };
              }
            } else {
              result = {
                fileName: file.name || file.filename,
                error: 'Document is not detected as a Purchase Order',
                processedAt: new Date().toISOString(),
                detection_result: poDetection.data
              };
            }
            break;
            
          default:
            // General document processing using invoice extraction agent
            const generalResult = await this.invoiceExtractionAgent.process(fileObj);
            if (generalResult.success) {
              result = {
                ...generalResult.data,
                fileName: file.name || file.filename,
                source: file.source || 'workflow',
                processedAt: new Date().toISOString(),
                document_type: 'general',
                extraction_confidence: generalResult.data?.extraction_confidence || 0.7
              };
              successCount++;
            } else {
              result = {
                fileName: file.name || file.filename,
                error: generalResult.error || 'General processing failed',
                processedAt: new Date().toISOString()
              };
            }
            break;
        }
        
        extractedData.push(result);
        console.log('✅ REAL Processing completed for:', file.name || file.filename);
        
        // Small delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error('❌ REAL Processing error for file:', file.name || file.filename, error);
        extractedData.push({
          fileName: file.name || file.filename,
          error: error instanceof Error ? error.message : 'Processing failed',
          processedAt: new Date().toISOString()
        });
      }
    }
    
    console.log('✅ REAL Document processing completed. Extracted', extractedData.length, 'records, successful:', successCount);
    
    return {
      processingType,
      extractedData,
      processedCount: extractedData.length,
      successCount
    };
  }
}
