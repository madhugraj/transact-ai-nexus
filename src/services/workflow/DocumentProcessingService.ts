
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
        console.log('📄 File details:', {
          hasContent: !!file.content,
          hasFile: !!file.file,
          type: file.type,
          size: file.size
        });
        
        // Convert file object to actual File if needed
        let fileObj = file;
        
        if (file.file && file.file instanceof File) {
          // Direct File object
          fileObj = file.file;
          console.log('✅ Using direct File object');
        } else if (file.content && file.name) {
          // Convert base64 content to File object
          console.log('🔄 Converting base64 content to File object');
          try {
            // Remove data URL prefix if present
            let base64Data = file.content;
            if (base64Data.startsWith('data:')) {
              base64Data = base64Data.split(',')[1];
            }
            
            // Convert base64 to blob
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: file.type || 'application/pdf' });
            
            fileObj = new File([blob], file.name, { type: file.type || 'application/pdf' });
            console.log('✅ Successfully created File from base64, size:', fileObj.size);
          } catch (conversionError) {
            console.error('❌ Failed to convert base64 to File:', conversionError);
            throw new Error(`Failed to convert file content: ${conversionError.message}`);
          }
        } else if (file instanceof File) {
          // Already a File object
          fileObj = file;
          console.log('✅ Already a File object');
        } else {
          console.error('❌ Invalid file format:', file);
          throw new Error('Invalid file format - no usable file content found');
        }
        
        // Validate the File object
        if (!(fileObj instanceof File)) {
          console.error('❌ Not a valid File object:', typeof fileObj);
          throw new Error('Failed to create valid File object');
        }
        
        console.log('✅ File object ready for processing:', {
          name: fileObj.name,
          size: fileObj.size,
          type: fileObj.type
        });
        
        let result;
        
        switch (processingType) {
          case 'invoice-extraction':
            // First detect if it's an invoice
            console.log('🔍 Starting invoice detection...');
            const invoiceDetection = await this.invoiceDetectionAgent.process(fileObj);
            console.log('🔍 Invoice detection result:', invoiceDetection);
            
            if (invoiceDetection.success && invoiceDetection.data?.is_invoice) {
              console.log('✅ Invoice detected, extracting data...');
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
                console.log('✅ Invoice extraction successful');
              } else {
                console.error('❌ Invoice extraction failed:', extractionResult.error);
                result = {
                  fileName: file.name || file.filename,
                  error: extractionResult.error || 'Invoice extraction failed',
                  processedAt: new Date().toISOString()
                };
              }
            } else {
              console.log('❌ Document not detected as invoice');
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
