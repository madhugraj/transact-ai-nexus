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
    console.log(`📊 Extracted data:`, extractedData);
    
    try {
      // Get current user from Supabase auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User must be authenticated to store invoice data');
      }

      // Validate required fields before processing
      if (!extractedData) {
        throw new Error('No extracted data provided');
      }

      // Extract invoice number - handle string to number conversion
      let invoiceNumber = 0;
      if (extractedData.invoice_number) {
        if (typeof extractedData.invoice_number === 'string') {
          const numberMatch = extractedData.invoice_number.match(/\d+/);
          invoiceNumber = numberMatch ? parseInt(numberMatch[0]) : 0;
        } else {
          invoiceNumber = parseInt(extractedData.invoice_number) || 0;
        }
      }

      console.log(`📋 Invoice number extracted: ${invoiceNumber}`);

      // Check if PO number exists in po_table if provided
      let poNumber = null;
      if (extractedData.po_number) {
        console.log(`🔍 Checking if PO number ${extractedData.po_number} exists in po_table...`);
        
        let poNumberValue;
        if (typeof extractedData.po_number === 'string') {
          const numberMatch = extractedData.po_number.match(/\d+/);
          poNumberValue = numberMatch ? parseInt(numberMatch[0]) : null;
        } else {
          poNumberValue = parseInt(extractedData.po_number) || null;
        }

        if (poNumberValue) {
          const { data: poData, error: poError } = await supabase
            .from('po_table')
            .select('po_number')
            .eq('po_number', poNumberValue)
            .eq('user_id', user.id) // Only check user's own POs
            .single();

          if (poError && poError.code !== 'PGRST116') {
            console.error('Error checking PO existence:', poError);
          } else if (poData) {
            poNumber = poNumberValue;
            console.log(`✅ PO number ${poNumberValue} exists in po_table`);
          } else {
            console.log(`⚠️ PO number ${poNumberValue} not found in user's po_table - will proceed with null PO reference`);
          }
        }
      } else {
        console.log(`ℹ️ No PO number found in extracted data - will proceed with null PO reference`);
      }

      // Process line items
      const lineItems = extractedData.line_items || [];
      console.log(`📊 Line items found: ${lineItems.length}`);

      if (lineItems.length > 0) {
        console.log(`💾 Storing ${lineItems.length} line item(s) for invoice: ${invoiceNumber}`);
        
        for (let i = 0; i < lineItems.length; i++) {
          const lineItem = lineItems[i];
          console.log(`💾 Inserting line item ${i + 1}/${lineItems.length} for invoice: ${invoiceNumber}`);
          
          // Check if this exact record already exists to prevent duplicates
          const { data: existingRecord } = await supabase
            .from('invoice_table')
            .select('*')
            .eq('invoice_number', invoiceNumber)
            .eq('attachment_invoice_name', filename)
            .eq('email_header', email.subject || '')
            .eq('user_id', user.id); // Only check user's own invoices

          if (existingRecord && existingRecord.length > 0) {
            console.log(`⚠️ Record already exists for invoice ${invoiceNumber} with filename ${filename}, skipping insertion`);
            continue;
          }
          
          // Map to the actual invoice_table schema with user_id
          const invoiceRecord = {
            user_id: user.id, // Add user_id for RLS
            po_number: poNumber,
            invoice_date: extractedData.invoice_date || null,
            invoice_number: invoiceNumber,
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

          console.log(`💾 Attempting to insert invoice record:`, {
            invoice_number: invoiceRecord.invoice_number,
            po_number: invoiceRecord.po_number,
            attachment_invoice_name: invoiceRecord.attachment_invoice_name,
            email_header: invoiceRecord.email_header,
            user_id: invoiceRecord.user_id
          });

          try {
            const { data, error: insertError } = await supabase
              .from('invoice_table')
              .insert([invoiceRecord])
              .select();

            if (insertError) {
              console.error(`❌ Database insert error for line item ${i + 1}:`, insertError);
              
              if (insertError.code === '23505') {
                console.log(`⚠️ Duplicate key detected for line item ${i + 1}, skipping but continuing with next items`);
                continue;
              }
              
              throw insertError;
            } else {
              console.log(`✅ Successfully inserted line item ${i + 1}/${lineItems.length} into invoice_table`, data);
            }
          } catch (itemError: any) {
            console.error(`❌ Error inserting line item ${i + 1}:`, itemError);
            
            if (itemError.code === '23505') {
              console.log(`⚠️ Duplicate key detected for line item ${i + 1}, continuing with next items`);
              continue;
            }
            
            throw itemError;
          }
        }
      } else {
        // Handle case with no line items - create single record
        console.log(`💾 No line items found, creating single invoice record`);
        
        // Check if this exact record already exists to prevent duplicates
        const { data: existingRecord } = await supabase
          .from('invoice_table')
          .select('*')
          .eq('invoice_number', invoiceNumber)
          .eq('attachment_invoice_name', filename)
          .eq('email_header', email.subject || '')
          .eq('user_id', user.id); // Only check user's own invoices

        if (existingRecord && existingRecord.length > 0) {
          console.log(`⚠️ Record already exists for invoice ${invoiceNumber} with filename ${filename}, skipping insertion`);
          return;
        }
        
        const invoiceRecord = {
          user_id: user.id, // Add user_id for RLS
          po_number: poNumber,
          invoice_date: extractedData.invoice_date || null,
          invoice_number: invoiceNumber,
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

        console.log(`💾 Attempting to insert single invoice record:`, {
          invoice_number: invoiceRecord.invoice_number,
          po_number: invoiceRecord.po_number,
          attachment_invoice_name: invoiceRecord.attachment_invoice_name,
          user_id: invoiceRecord.user_id
        });

        try {
          const { data, error: insertError } = await supabase
            .from('invoice_table')
            .insert([invoiceRecord])
            .select();

          if (insertError) {
            console.error(`❌ Database insert error:`, insertError);
            
            if (insertError.code === '23505') {
              console.log(`⚠️ Duplicate key detected for invoice record, but processing completed`);
              return;
            }
            
            throw insertError;
          } else {
            console.log(`✅ Successfully inserted invoice record into invoice_table`, data);
          }
        } catch (insertError: any) {
          console.error(`❌ Failed to insert invoice record:`, insertError);
          
          if (insertError.code === '23505') {
            console.log(`⚠️ Duplicate key detected for invoice record, but processing completed`);
            return;
          }
          
          throw insertError;
        }
      }

      console.log(`✅ Successfully processed invoice data for ${filename} - check invoice_table in Supabase`);

    } catch (error) {
      console.error(`❌ Error storing invoice in database for ${filename}:`, error);
      throw error;
    }
  }

  async storePOInDatabase(
    extractedData: any,
    email: GmailMessage,
    filename: string,
    emailContext: any
  ): Promise<void> {
    console.log(`💾 Processing PO data for storage: ${filename}`);
    console.log(`📊 Extracted data:`, extractedData);
    
    try {
      // Get current user from Supabase auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User must be authenticated to store PO data');
      }

      // Validate required fields before processing
      if (!extractedData) {
        throw new Error('No extracted data provided');
      }

      // Extract PO number - handle string to number conversion
      let poNumber = 0;
      if (extractedData.po_number) {
        if (typeof extractedData.po_number === 'string') {
          const numberMatch = extractedData.po_number.match(/\d+/);
          poNumber = numberMatch ? parseInt(numberMatch[0]) : 0;
        } else {
          poNumber = parseInt(extractedData.po_number) || 0;
        }
      }

      console.log(`📋 PO number extracted: ${poNumber}`);

      // Check if this exact record already exists to prevent duplicates
      const { data: existingRecord } = await supabase
        .from('po_table')
        .select('*')
        .eq('po_number', poNumber)
        .eq('file_name', filename)
        .eq('user_id', user.id); // Only check user's own POs

      if (existingRecord && existingRecord.length > 0) {
        console.log(`⚠️ Record already exists for PO ${poNumber} with filename ${filename}, skipping insertion`);
        return;
      }

      // Map to the actual po_table schema with user_id
      const poRecord = {
        user_id: user.id, // Add user_id for RLS
        po_number: poNumber,
        po_date: extractedData.po_date || null,
        file_name: filename,
        vendor_code: extractedData.vendor_code || '',
        bill_to_address: extractedData.bill_to_address || '',
        ship_to: extractedData.ship_to || '',
        del_start_date: extractedData.del_start_date || null,
        del_end_date: extractedData.del_end_date || null,
        terms_conditions: extractedData.terms_conditions || '',
        gstn: extractedData.gstn || '',
        project: extractedData.project || '',
        description: extractedData.line_items || extractedData.description || {}
      };

      console.log(`💾 Attempting to insert PO record:`, {
        po_number: poRecord.po_number,
        file_name: poRecord.file_name,
        user_id: poRecord.user_id
      });

      const { data, error: insertError } = await supabase
        .from('po_table')
        .insert([poRecord])
        .select();

      if (insertError) {
        console.error(`❌ Database insert error:`, insertError);
        
        if (insertError.code === '23505') {
          console.log(`⚠️ Duplicate key detected for PO record, but processing completed`);
          return;
        }
        
        throw insertError;
      } else {
        console.log(`✅ Successfully inserted PO record into po_table`, data);
      }

      console.log(`✅ Successfully processed PO data for ${filename} - check po_table in Supabase`);

    } catch (error) {
      console.error(`❌ Error storing PO in database for ${filename}:`, error);
      throw error;
    }
  }
}
