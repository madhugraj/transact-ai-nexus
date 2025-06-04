
import { GmailAttachmentProcessor } from '@/services/gmail/attachmentProcessor';
import { InvoiceDetectionAgent } from '@/services/agents/InvoiceDetectionAgent';
import { InvoiceDataExtractionAgent } from '@/services/agents/InvoiceDataExtractionAgent';
import { GmailMessage, ProcessingResult } from './types';

export class EmailAttachmentProcessor {
  private invoiceDetectionAgent: InvoiceDetectionAgent;
  private invoiceDataExtractionAgent: InvoiceDataExtractionAgent;

  constructor() {
    this.invoiceDetectionAgent = new InvoiceDetectionAgent();
    this.invoiceDataExtractionAgent = new InvoiceDataExtractionAgent();
  }

  async processAttachment(
    attachment: any,
    email: GmailMessage,
    emailContext: any,
    result: ProcessingResult
  ): Promise<boolean> {
    console.log(`🔍 Processing attachment: ${attachment.filename} (${attachment.mimeType})`);
    
    try {
      // Step 3a: Validate attachment as invoice using AI
      console.log(`🔍 Step 3a: Validating ${attachment.filename} as invoice...`);
      const validation = await this.invoiceDetectionAgent.process(attachment.file);
      
      const validationResult = {
        ...validation,
        filename: attachment.filename,
        fileSize: attachment.size
      };
      result.invoiceValidation.push(validationResult);

      console.log(`🔍 Invoice detection result for ${attachment.filename}: ${validation.success && validation.data?.is_invoice ? 'INVOICE' : 'NOT INVOICE'}`);

      // Step 3b: If it's an invoice, extract structured data
      if (validation.success && validation.data?.is_invoice) {
        console.log(`✅ Invoice detected: ${attachment.filename} - proceeding with data extraction`);
        
        console.log(`📊 Step 3b: Extracting data from ${attachment.filename}...`);
        const extraction = await this.invoiceDataExtractionAgent.process(attachment.file);
        
        const extractionResult = {
          ...extraction,
          filename: attachment.filename,
          fileSize: attachment.size
        };
        result.extractedData.push(extractionResult);

        // Return whether extraction was successful
        if (extraction.success && extraction.data) {
          console.log(`✅ Data extraction successful for ${attachment.filename}`);
          return true;
        } else {
          console.log(`❌ Data extraction failed for ${attachment.filename}`);
        }
      } else {
        console.log(`❌ Not an invoice: ${attachment.filename}`);
      }
    } catch (error) {
      console.error(`❌ Error processing attachment ${attachment.filename}:`, error);
    }
    
    return false;
  }
}
