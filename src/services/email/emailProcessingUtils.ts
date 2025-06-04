
import { GmailAttachmentProcessor } from '@/services/gmail/attachmentProcessor';
import { InvoiceDetectionAgent } from '@/services/agents/InvoiceDetectionAgent';
import { InvoiceDataExtractionAgent } from '@/services/agents/InvoiceDataExtractionAgent';
import { supabase } from '@/integrations/supabase/client';

interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  hasAttachments: boolean;
  labels: string[];
}

interface ProcessingResult {
  email: GmailMessage;
  emailContext: any;
  attachments: any[];
  invoiceValidation: any[];
  extractedData: any[];
  status: 'processing' | 'completed' | 'error';
  error?: string;
}

export class EmailProcessingService {
  private invoiceDetectionAgent: InvoiceDetectionAgent;
  private invoiceDataExtractionAgent: InvoiceDataExtractionAgent;

  constructor() {
    this.invoiceDetectionAgent = new InvoiceDetectionAgent();
    this.invoiceDataExtractionAgent = new InvoiceDataExtractionAgent();
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

      if (!emailContext.isLikelyInvoice) {
        console.log('❌ Email does not appear to contain invoice-related content');
        result.status = 'completed';
        result.error = 'Email does not appear invoice-related';
        return result;
      }

      // Step 2: Extract real email attachments
      console.log('📎 Step 2: Extracting email attachments...');
      const attachments = await attachmentProcessor.extractEmailAttachments(email.id);
      result.attachments = attachments;

      if (attachments.length === 0) {
        result.status = 'completed';
        result.error = 'No supported attachments found (PDF/Image files)';
        return result;
      }

      console.log(`✅ Found ${attachments.length} attachments to process`);

      // Step 3: Process each attachment
      for (const attachment of attachments) {
        await this.processAttachment(attachment, email, emailContext.context, result);
      }

      result.status = 'completed';
      console.log(`✅ Email processing completed for: ${email.subject}`);

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
  ) {
    console.log(`🔍 Processing attachment: ${attachment.filename}`);
    
    try {
      // Step 3a: Validate attachment as invoice using AI
      const validation = await this.invoiceDetectionAgent.process(attachment.file);
      result.invoiceValidation.push({
        ...validation,
        filename: attachment.filename,
        fileSize: attachment.size
      });

      // Step 3b: If it's an invoice, extract structured data
      if (validation.success && validation.data?.is_invoice) {
        console.log(`✅ Invoice detected: ${attachment.filename}`);
        
        const extraction = await this.invoiceDataExtractionAgent.process(attachment.file);
        result.extractedData.push({
          ...extraction,
          filename: attachment.filename,
          fileSize: attachment.size
        });

        // Step 3c: Store in database
        if (extraction.success && extraction.data) {
          console.log('💾 Storing invoice data in database...');
          await this.storeInvoiceInDatabase(
            extraction.data, 
            email, 
            attachment.filename,
            emailContext
          );
        }
      } else {
        console.log(`❌ Not an invoice: ${attachment.filename}`);
      }
    } catch (error) {
      console.error(`Error processing attachment ${attachment.filename}:`, error);
    }
  }

  private async storeInvoiceInDatabase(
    invoiceData: any, 
    email: GmailMessage, 
    fileName: string,
    emailContext: any
  ) {
    try {
      // Store each line item as a separate row in invoice_table
      for (const lineItem of invoiceData.line_items || []) {
        console.log('💾 Inserting invoice data:', {
          invoice_number: invoiceData.invoice_number,
          po_number: invoiceData.po_number,
          fileName,
          email_subject: email.subject
        });

        const { data, error } = await supabase
          .from('invoice_table')
          .insert({
            invoice_number: parseInt(invoiceData.invoice_number) || 0,
            po_number: parseInt(invoiceData.po_number) || 0,
            invoice_date: invoiceData.invoice_date,
            email_header: email.subject,
            email_date: email.date,
            attachment_invoice_name: fileName,
            details: {
              supplier_gst_number: invoiceData.supplier_gst_number,
              bill_to_gst_number: invoiceData.bill_to_gst_number,
              shipping_address: invoiceData.shipping_address,
              seal_and_sign_present: invoiceData.seal_and_sign_present,
              email_from: email.from,
              file_name: fileName,
              line_item: lineItem,
              extraction_confidence: invoiceData.extraction_confidence,
              email_context: emailContext,
              processed_at: new Date().toISOString()
            }
          })
          .select();

        if (error) {
          console.error('❌ Database insert error:', error);
          // Log the error but continue processing other invoices
          console.log('Continuing with next invoice...');
        } else {
          console.log('✅ Invoice data stored successfully:', data);
        }
      }
    } catch (error) {
      console.error('❌ Error storing invoice in database:', error);
      // Don't throw error to continue processing other invoices
      console.log('Continuing with next invoice...');
    }
  }
}
