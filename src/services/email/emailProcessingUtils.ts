
import { GmailAttachmentProcessor } from '@/services/gmail/attachmentProcessor';
import { EmailAttachmentProcessor } from './attachmentProcessor';
import { DatabaseStorage } from './databaseStorage';
import { GmailMessage, ProcessingResult } from './types';

export class EmailProcessingService {
  private emailAttachmentProcessor: EmailAttachmentProcessor;
  private databaseStorage: DatabaseStorage;

  constructor() {
    this.emailAttachmentProcessor = new EmailAttachmentProcessor();
    this.databaseStorage = new DatabaseStorage();
  }

  async processEmailForInvoices(
    email: GmailMessage, 
    accessToken: string
  ): Promise<ProcessingResult> {
    console.log(`🔄 Processing email: ${email.subject}`);

    const result: ProcessingResult = {
      email,
      emailContext: null,
      attachments: [],
      invoiceValidation: [],
      extractedData: [],
      status: 'processing'
    };

    try {
      const attachmentProcessor = new GmailAttachmentProcessor(accessToken);

      // Step 1: Analyze email context for invoice indicators
      console.log('📧 Step 1: Analyzing email context...');
      const emailContext = await attachmentProcessor.analyzeEmailForInvoiceContext(email.id);
      result.emailContext = emailContext;
      
      console.log(`📧 Email context analysis: ${emailContext.isLikelyInvoice ? 'LIKELY INVOICE' : 'NOT INVOICE'}`);
      console.log(`📎 Total attachments detected: ${emailContext.context.attachmentCount}`);

      if (!emailContext.isLikelyInvoice) {
        console.log('❌ Email does not appear to contain invoice-related content');
        result.status = 'completed';
        result.error = 'Email does not appear invoice-related';
        return result;
      }

      // Step 2: Extract real email attachments (only supported types)
      console.log('📎 Step 2: Extracting supported email attachments (PDF/Images)...');
      const attachments = await attachmentProcessor.extractEmailAttachments(email.id);
      result.attachments = attachments;

      console.log(`📎 Total attachments found: ${emailContext.context.attachmentCount}`);
      console.log(`📎 Supported attachments extracted: ${attachments.length}`);

      if (attachments.length === 0) {
        result.status = 'completed';
        result.error = 'No supported attachments found (PDF/Image files)';
        return result;
      }

      console.log(`✅ Found ${attachments.length} supported attachments to process`);

      // Step 3: Process each attachment individually
      let processedInvoices = 0;
      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];
        console.log(`🔍 Processing attachment ${i + 1}/${attachments.length}: ${attachment.filename}`);
        
        const wasInvoiceProcessed = await this.processAttachment(attachment, email, emailContext.context, result);
        if (wasInvoiceProcessed) {
          processedInvoices++;
        }
      }

      result.status = 'completed';
      console.log(`✅ Email processing completed for: ${email.subject}`);
      console.log(`📊 Summary: ${processedInvoices} invoices stored from ${attachments.length} attachments`);

    } catch (error) {
      console.error(`❌ Error processing email ${email.subject}:`, error);
      result.status = 'error';
      result.error = error instanceof Error ? error.message : 'Unknown processing error';
    }

    return result;
  }

  private async processAttachment(
    attachment: any,
    email: GmailMessage,
    emailContext: any,
    result: ProcessingResult
  ): Promise<boolean> {
    const wasExtracted = await this.emailAttachmentProcessor.processAttachment(attachment, email, emailContext, result);
    
    if (wasExtracted) {
      // Find the extraction result for this attachment
      const extraction = result.extractedData.find(e => e.filename === attachment.filename);
      
      if (extraction && extraction.success && extraction.data) {
        console.log(`💾 Step 3c: Storing invoice data from ${attachment.filename} in database...`);
        await this.databaseStorage.storeInvoiceInDatabase(
          extraction.data, 
          email, 
          attachment.filename,
          emailContext
        );
        console.log(`✅ Successfully stored invoice data for ${attachment.filename}`);
        return true;
      }
    }
    
    return false;
  }
}
