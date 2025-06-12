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

      console.log(`📋 Using new optimized invoices schema for ${filename}`);

      // Prepare invoice data for the new schema
      const invoiceData = {
        invoice_number: extractedData.invoice_number || `INV-${Date.now()}`,
        invoice_date: extractedData.invoice_date || new Date().toISOString().split('T')[0],
        supplier_gst_number: extractedData.supplier_gst_number || null,
        bill_to_gst_number: extractedData.bill_to_gst_number || null,
        po_number: extractedData.po_number || null,
        shipping_address: extractedData.shipping_address || null,
        seal_and_sign_present: extractedData.seal_and_sign_present || false,
        seal_sign_image: extractedData.seal_sign_image ? Buffer.from(extractedData.seal_sign_image, 'base64') : null,
        document_quality_notes: extractedData.document_quality_notes || `Extracted from email: ${email.subject}`,
        raw_json: extractedData,
        confidence_score: Math.round((extractedData.extraction_confidence || 0.85) * 100)
      };

      console.log(`💾 Inserting invoice record:`, {
        invoice_number: invoiceData.invoice_number,
        po_number: invoiceData.po_number,
        confidence_score: invoiceData.confidence_score,
        has_seal_image: !!invoiceData.seal_sign_image
      });

      // Insert the main invoice record
      const { data: invoiceRecord, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceError) {
        console.error('❌ Failed to insert invoice:', invoiceError);
        throw new Error(`Failed to store invoice data: ${invoiceError.message}`);
      }

      console.log('✅ Invoice inserted successfully:', invoiceRecord.id);

      // Insert line items if they exist
      if (extractedData.line_items && extractedData.line_items.length > 0) {
        console.log('💾 Inserting', extractedData.line_items.length, 'line items');
        
        const lineItemsData = extractedData.line_items.map((item: any, index: number) => ({
          invoice_id: invoiceRecord.id,
          item_index: index + 1,
          description: item.description || null,
          hsn_sac: item.hsn_sac || null,
          quantity: parseFloat(item.quantity) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
          total_amount: parseFloat(item.total_amount) || 0,
          serial_number: item.serial_number || null,
          item_confidence: Math.round((item.confidence || 0.85) * 100)
        }));

        const { data: lineItemsRecords, error: lineItemsError } = await supabase
          .from('invoice_line_items')
          .insert(lineItemsData)
          .select();

        if (lineItemsError) {
          console.error('❌ Failed to insert line items:', lineItemsError);
          console.error('❌ Line items data:', lineItemsData);
          // Don't throw here, we still have the main invoice record
        } else {
          console.log('✅ Line items inserted successfully:', lineItemsRecords.length);
        }
      }

      console.log(`✅ Successfully processed invoice data for ${filename} - check invoices table in Supabase`);

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
