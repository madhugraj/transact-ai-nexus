
import { supabase } from '@/integrations/supabase/client';

export class DatabaseStorageService {
  async storeData(data: any[], config: any = {}): Promise<{ recordsStored: number; recordsProcessed: number }> {
    console.log('📊 DatabaseStorageService: Storing data', {
      recordCount: data.length,
      table: config.table,
      action: config.action,
      processingType: config.processingType
    });
    
    if (!data || data.length === 0) {
      console.log('⚠️ No data to store');
      return { recordsStored: 0, recordsProcessed: 0 };
    }
    
    const tableName = config.table || 'extracted_json';
    const processingType = config.processingType || 'general';
    
    try {
      // Handle structured invoice data for the invoices table
      if (tableName === 'invoices' && processingType === 'invoice-extraction') {
        return await this.storeInvoiceData(data);
      }
      
      // Handle PO data for the po_table  
      if (tableName === 'po_table' && processingType === 'po-extraction') {
        return await this.storePOData(data);
      }
      
      // Handle general JSON storage for extracted_json table
      return await this.storeGenericData(data, tableName);
      
    } catch (error) {
      console.error('❌ DatabaseStorageService error:', error);
      
      // Final fallback to extracted_json
      if (tableName !== 'extracted_json') {
        console.log('🔄 Final fallback attempt to extracted_json...');
        return await this.storeGenericData(data, 'extracted_json');
      }
      
      return {
        recordsStored: 0,
        recordsProcessed: data.length
      };
    }
  }
  
  private async storeInvoiceData(data: any[]): Promise<{ recordsStored: number; recordsProcessed: number }> {
    console.log('📋 Storing structured invoice data to invoices table');
    
    let recordsStored = 0;
    
    for (const invoiceData of data) {
      try {
        // Prepare main invoice record
        const invoiceRecord = {
          invoice_number: invoiceData.invoice_number || `INV-${Date.now()}`,
          invoice_date: invoiceData.invoice_date || new Date().toISOString().split('T')[0],
          supplier_gst_number: invoiceData.supplier_gst_number || null,
          bill_to_gst_number: invoiceData.bill_to_gst_number || null,
          po_number: invoiceData.po_number || null,
          shipping_address: invoiceData.shipping_address || null,
          seal_and_sign_present: invoiceData.seal_and_sign_present || false,
          seal_sign_image: invoiceData.seal_sign_image ? Buffer.from(invoiceData.seal_sign_image, 'base64') : null,
          document_quality_notes: invoiceData.document_quality_notes || null,
          raw_json: invoiceData,
          confidence_score: Math.round((invoiceData.extraction_confidence || 0.85) * 100)
        };
        
        console.log('💾 Inserting invoice:', invoiceRecord.invoice_number);
        
        // Insert main invoice record
        const { data: insertedInvoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert(invoiceRecord)
          .select()
          .single();
        
        if (invoiceError) {
          console.error('❌ Failed to insert invoice:', invoiceError);
          continue;
        }
        
        // Insert line items if they exist
        if (invoiceData.line_items && invoiceData.line_items.length > 0) {
          const lineItemsData = invoiceData.line_items.map((item: any, index: number) => ({
            invoice_id: insertedInvoice.id,
            item_index: index + 1,
            description: item.description || null,
            hsn_sac: item.hsn_sac || null,
            quantity: parseFloat(item.quantity) || 0,
            unit_price: parseFloat(item.unit_price) || 0,
            total_amount: parseFloat(item.total_amount) || 0,
            serial_number: item.serial_number || null,
            item_confidence: Math.round((item.confidence || 0.85) * 100)
          }));
          
          const { error: lineItemsError } = await supabase
            .from('invoice_line_items')
            .insert(lineItemsData);
          
          if (lineItemsError) {
            console.error('❌ Failed to insert line items:', lineItemsError);
          } else {
            console.log('✅ Line items inserted:', lineItemsData.length);
          }
        }
        
        recordsStored++;
        console.log('✅ Invoice stored successfully:', insertedInvoice.invoice_number);
        
      } catch (error) {
        console.error('❌ Error storing individual invoice:', error);
      }
    }
    
    return {
      recordsStored,
      recordsProcessed: data.length
    };
  }
  
  private async storePOData(data: any[]): Promise<{ recordsStored: number; recordsProcessed: number }> {
    console.log('📋 Storing PO data to po_table');
    
    const validData = data.map(item => ({
      po_number: parseInt(item.po_number) || 0,
      po_date: item.po_date || null,
      file_name: item.fileName || item.file_name || `po_${Date.now()}`,
      vendor_code: item.vendor_code || '',
      bill_to_address: item.bill_to_address || '',
      ship_to: item.ship_to || '',
      del_start_date: item.del_start_date || null,
      del_end_date: item.del_end_date || null,
      terms_conditions: item.terms_conditions || '',
      gstn: item.gstn || '',
      project: item.project || '',
      description: item.line_items || item.description || {}
    }));
    
    const { data: insertedData, error } = await supabase
      .from('po_table')
      .insert(validData)
      .select();
    
    if (error) {
      console.error('❌ PO table insertion error:', error);
      throw error;
    }
    
    console.log('✅ Successfully stored PO data:', insertedData?.length || 0);
    
    return {
      recordsStored: insertedData?.length || 0,
      recordsProcessed: data.length
    };
  }
  
  private async storeGenericData(data: any[], tableName: string): Promise<{ recordsStored: number; recordsProcessed: number }> {
    console.log('📋 Storing generic data to', tableName);
    
    // Validate data before insertion
    const validData = data.filter(record => {
      if (!record || typeof record !== 'object') {
        console.warn('⚠️ Skipping invalid record:', record);
        return false;
      }
      return true;
    });
    
    if (validData.length === 0) {
      console.warn('⚠️ No valid data to store after filtering');
      return { recordsStored: 0, recordsProcessed: data.length };
    }
    
    // Transform for extracted_json format if needed
    const transformedData = tableName === 'extracted_json' 
      ? validData.map((record, index) => ({
          json_extract: record,
          file_name: record.fileName || record.file_name || `extracted_document_${index + 1}_${Date.now()}`
        }))
      : validData;
    
    console.log('📄 Attempting to insert', transformedData.length, 'records to table:', tableName);
    
    const { data: insertedData, error } = await supabase
      .from(tableName)
      .insert(transformedData)
      .select();
    
    if (error) {
      console.error('❌ Database insertion error:', error);
      throw error;
    }
    
    const recordsStored = insertedData?.length || 0;
    console.log('✅ Successfully stored', recordsStored, 'records in', tableName);
    
    return {
      recordsStored,
      recordsProcessed: data.length
    };
  }
  
  async validateTableSchema(tableName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error && error.code === '42P01') {
        console.warn(`⚠️ Table ${tableName} does not exist`);
        return false;
      }
      
      return !error;
    } catch (error) {
      console.error('❌ Table validation error:', error);
      return false;
    }
  }
}
