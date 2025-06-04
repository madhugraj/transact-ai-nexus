
import { supabase } from '@/integrations/supabase/client';
import { GmailMessage } from './types';

export class DatabaseStorage {
  async storeInvoiceInDatabase(
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
          throw error;
        } else {
          console.log(`✅ Line item ${i + 1}/${lineItems.length} stored successfully:`, data);
        }
      }

      console.log(`✅ All ${lineItems.length} line item(s) stored successfully for ${fileName}`);
    } catch (error) {
      console.error(`❌ Error storing invoice in database for ${fileName}:`, error);
      throw error;
    }
  }
}
