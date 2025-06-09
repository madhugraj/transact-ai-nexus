
import { supabase } from '@/integrations/supabase/client';

export class DatabaseStorageService {
  async storeExtractedData(extractedData: any[], tableName: string, action: string): Promise<any> {
    console.log('💾 Storing', extractedData.length, 'records to table:', tableName, 'with action:', action);
    
    const results = {
      table: tableName,
      action,
      totalRecords: extractedData.length,
      successfulInserts: 0,
      errors: [] as any[]
    };

    for (const data of extractedData) {
      if (data.error) {
        results.errors.push({
          fileName: data.fileName,
          error: data.error
        });
        continue;
      }

      try {
        let insertData: any = {};

        // Map extracted data to database schema based on table
        if (tableName === 'invoice_table') {
          insertData = {
            invoice_number: parseInt(data.invoiceNumber?.replace('INV-', '') || '0'),
            invoice_date: data.date,
            details: {
              vendor: data.vendor,
              amount: data.amount,
              dueDate: data.dueDate,
              confidence: data.confidence,
              fileName: data.fileName,
              source: data.source
            },
            attachment_invoice_name: data.fileName
          };
        } else if (tableName === 'po_table') {
          insertData = {
            po_number: parseInt(data.poNumber?.replace('PO-', '') || '0'),
            po_date: data.date,
            file_name: data.fileName,
            description: {
              vendor: data.vendor,
              amount: data.amount,
              confidence: data.confidence,
              source: data.source
            }
          };
        } else if (tableName === 'extracted_json') {
          insertData = {
            file_name: data.fileName,
            json_extract: data
          };
        } else {
          // For other tables, store in extracted_json as fallback
          insertData = {
            file_name: data.fileName,
            json_extract: data
          };
          tableName = 'extracted_json';
        }

        console.log('💾 Inserting data to', tableName, ':', insertData);

        const { error } = action === 'upsert' 
          ? await supabase.from(tableName).upsert(insertData)
          : await supabase.from(tableName).insert(insertData);

        if (error) {
          console.error('❌ Database insert error:', error);
          results.errors.push({
            fileName: data.fileName,
            error: error.message
          });
        } else {
          results.successfulInserts++;
          console.log('✅ Successfully stored:', data.fileName);
        }

      } catch (error) {
        console.error('❌ Error storing data for:', data.fileName, error);
        results.errors.push({
          fileName: data.fileName,
          error: error instanceof Error ? error.message : 'Storage failed'
        });
      }
    }

    console.log('💾 Storage completed:', results);
    return results;
  }
}
