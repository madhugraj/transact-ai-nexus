
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

        // Step 3c: Store in database if extraction successful
        if (extraction.success && extraction.data) {
          console.log(`💾 Step 3c: Storing invoice data from ${attachment.filename} in database...`);
          await this.storeInvoiceInDatabase(
            extraction.data, 
            email, 
            attachment.filename,
            emailContext
          );
          console.log(`✅ Successfully stored invoice data for ${attachment.filename}`);
          return true; // Invoice was successfully processed and stored
        } else {
          console.log(`❌ Data extraction failed for ${attachment.filename}`);
        }
      } else {
        console.log(`❌ Not an invoice: ${attachment.filename}`);
      }
    } catch (error) {
      console.error(`❌ Error processing attachment ${attachment.filename}:`, error);
    }
    
    return false; // Invoice was not processed/stored
  }

  private async storeInvoiceInDatabase(
    invoiceData: any, 
    email: GmailMessage, 
    fileName: string,
    emailContext: any
  ) {
    try {
      console.log(`💾 Processing invoice data for storage: ${fileName}`);
      console.log(`📊 Line items found: ${invoiceData.line_items?.length || 0}`);

      // Handle case where there are no line items or line_items is not an array
      const lineItems = Array.isArray(invoiceData.line_items) && invoiceData.line_items.length > 0 
        ? invoiceData.line_items 
        : [{ description: 'No line items found', quantity: 0, unit_price: 0, total_amount: 0 }];

      console.log(`💾 Storing ${lineItems.length} line item(s) for invoice: ${invoiceData.invoice_number}`);

      // Store each line item as a separate row in invoice_table
      for (let i = 0; i < lineItems.length; i++) {
        const lineItem = lineItems[i];
        console.log(`💾 Inserting line item ${i + 1}/${lineItems.length} for invoice: ${invoiceData.invoice_number}`);

        const invoiceRecord = {
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
            line_item_index: i + 1,
            total_line_items: lineItems.length,
            extraction_confidence: invoiceData.extraction_confidence,
            email_context: emailContext,
            processed_at: new Date().toISOString()
          }
        };

        console.log(`💾 Inserting invoice record:`, {
          invoice_number: invoiceRecord.invoice_number,
          po_number: invoiceRecord.po_number,
          fileName: fileName,
          email_subject: email.subject,
          line_item_index: i + 1,
          total_line_items: lineItems.length
        });

        const { data, error } = await supabase
          .from('invoice_table')
          .insert(invoiceRecord)
          .select();

        if (error) {
          console.error(`❌ Database insert error for line item ${i + 1}:`, error);
          throw error; // Re-throw to be caught by outer try-catch
        } else {
          console.log(`✅ Line item ${i + 1}/${lineItems.length} stored successfully:`, data);
        }
      }

      console.log(`✅ All ${lineItems.length} line item(s) stored successfully for ${fileName}`);
    } catch (error) {
      console.error(`❌ Error storing invoice in database for ${fileName}:`, error);
      throw error; // Re-throw so the calling function knows there was an error
    }
  }
}
