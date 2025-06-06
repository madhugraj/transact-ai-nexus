
import { supabase } from '@/integrations/supabase/client';
import { GmailMessage } from './types';

export class DatabaseStorage {
  async storeInvoiceInDatabase(
    extractedData: any,
    email: GmailMessage,
    filename: string,
    emailContext: any
  ): Promise<void> {
    console.log(`💾 Processing invoice data for storage: ${filename}`);
    
    try {
      // Validate required fields before processing
      if (!extractedData) {
        throw new Error('No extracted data provided');
      }

      // Check if PO number exists in po_table if provided
      let poExists = false;
      if (extractedData.po_number) {
        console.log(`🔍 Checking if PO number ${extractedData.po_number} exists in po_table...`);
        
        const { data: poData, error: poError } = await supabase
          .from('po_table')
          .select('po_number')
          .eq('po_number', extractedData.po_number)
          .single();

        if (poError && poError.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('Error checking PO existence:', poError);
        } else if (poData) {
          poExists = true;
          console.log(`✅ PO number ${extractedData.po_number} exists in po_table`);
        } else {
          console.log(`⚠️ PO number ${extractedData.po_number} not found in po_table - will proceed without PO reference`);
        }
      }

      // Process line items
      const lineItems = extractedData.line_items || [];
      console.log(`📊 Line items found: ${lineItems.length}`);

      if (lineItems.length > 0) {
        console.log(`💾 Storing ${lineItems.length} line item(s) for invoice: ${extractedData.invoice_number}`);
        
        for (let i = 0; i < lineItems.length; i++) {
          const lineItem = lineItems[i];
          console.log(`💾 Inserting line item ${i + 1}/${lineItems.length} for invoice: ${extractedData.invoice_number}`);
          
          // Map to the actual invoice_table schema
          const invoiceRecord = {
            po_number: poExists ? extractedData.po_number : null,
            invoice_date: extractedData.invoice_date || null,
            invoice_number: extractedData.invoice_number || 0,
            email_date: email.date ? new Date(email.date).toISOString().split('T')[0] : null,
            details: {
              vendor_name: extractedData.vendor_name || '',
              item_description: lineItem.description || lineItem.item_description || '',
              quantity: lineItem.quantity || 0,
              unit_price: lineItem.unit_price || lineItem.price || 0,
              line_total: lineItem.total || lineItem.line_total || (lineItem.quantity * lineItem.unit_price) || 0,
              gst_rate: lineItem.gst_rate || extractedData.gst_rate || 0,
              gst_amount: lineItem.gst_amount || extractedData.gst_amount || 0,
              total_amount: lineItem.total_amount || extractedData.total_amount || 0,
              line_item_index: i + 1,
              total_line_items: lineItems.length,
              extraction_confidence: extractedData.extraction_confidence || 0
            },
            attachment_invoice_name: filename,
            email_header: email.subject || ''
          };

          console.log(`💾 Inserting invoice record:`, {
            invoice_number: invoiceRecord.invoice_number,
            po_number: invoiceRecord.po_number,
            attachment_invoice_name: invoiceRecord.attachment_invoice_name,
            email_header: invoiceRecord.email_header
          });

          try {
            const { error: insertError } = await supabase
              .from('invoice_table')
              .insert([invoiceRecord]);

            if (insertError) {
              console.error(`❌ Database insert error for line item ${i + 1}:`, insertError);
              // Don't throw here, continue with other items
            } else {
              console.log(`✅ Successfully inserted line item ${i + 1}/${lineItems.length}`);
            }
          } catch (itemError) {
            console.error(`❌ Error inserting line item ${i + 1}:`, itemError);
            // Continue with other items
          }
        }
      } else {
        // Handle case with no line items - create single record
        console.log(`💾 No line items found, creating single invoice record`);
        
        const invoiceRecord = {
          po_number: poExists ? extractedData.po_number : null,
          invoice_date: extractedData.invoice_date || null,
          invoice_number: extractedData.invoice_number || 0,
          email_date: email.date ? new Date(email.date).toISOString().split('T')[0] : null,
          details: {
            vendor_name: extractedData.vendor_name || '',
            item_description: extractedData.description || 'No description available',
            quantity: 1,
            unit_price: extractedData.total_amount || 0,
            line_total: extractedData.total_amount || 0,
            gst_rate: extractedData.gst_rate || 0,
            gst_amount: extractedData.gst_amount || 0,
            total_amount: extractedData.total_amount || 0,
            extraction_confidence: extractedData.extraction_confidence || 0
          },
          attachment_invoice_name: filename,
          email_header: email.subject || ''
        };

        try {
          const { error: insertError } = await supabase
            .from('invoice_table')
            .insert([invoiceRecord]);

          if (insertError) {
            console.error(`❌ Database insert error:`, insertError);
            throw insertError;
          } else {
            console.log(`✅ Successfully inserted invoice record`);
          }
        } catch (insertError) {
          console.error(`❌ Failed to insert invoice record:`, insertError);
          throw insertError;
        }
      }

      console.log(`✅ Successfully processed invoice data for ${filename}`);

    } catch (error) {
      console.error(`❌ Error storing invoice in database for ${filename}:`, error);
      throw error;
    }
  }
}
