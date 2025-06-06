
import { PODetectionAgent } from '@/services/agents/PODetectionAgent';
import { PODataExtractionAgent } from '@/services/agents/PODataExtractionAgent';
import { supabase } from '@/integrations/supabase/client';

export class POProcessor {
  private poDetectionAgent = new PODetectionAgent();
  private poDataExtractionAgent = new PODataExtractionAgent();

  async processFiles(files: File[]): Promise<any[]> {
    const results = [];

    for (const [index, file] of files.entries()) {
      console.log(`📄 Processing file ${index + 1}/${files.length}:`, file.name);
      
      try {
        // Step 1: Detect if it's a PO
        console.log(`🔍 Starting PO detection for: ${file.name}`);
        const detectionResult = await this.poDetectionAgent.process(file);
        console.log(`🔍 Detection result:`, detectionResult);
        
        if (!detectionResult.success) {
          console.error(`❌ Detection failed for ${file.name}:`, detectionResult.error);
          results.push({
            fileName: file.name,
            isPO: false,
            error: detectionResult.error || 'Detection failed',
            status: 'error'
          });
          continue;
        }

        const isPO = detectionResult.data?.is_po;
        console.log(`📋 Is PO: ${isPO} for file: ${file.name}`);
        
        if (!isPO) {
          results.push({
            fileName: file.name,
            isPO: false,
            reason: detectionResult.data?.reason || 'Not detected as a PO',
            status: 'skipped'
          });
          continue;
        }

        // Step 2: Extract PO data
        console.log(`📊 Starting data extraction for: ${file.name}`);
        const extractionResult = await this.poDataExtractionAgent.process(file);
        console.log(`📊 Extraction result:`, extractionResult);
        
        if (!extractionResult.success) {
          console.error(`❌ Data extraction failed for ${file.name}:`, extractionResult.error);
          results.push({
            fileName: file.name,
            isPO: true,
            error: extractionResult.error || 'Data extraction failed',
            status: 'error'
          });
          continue;
        }

        const extractedData = extractionResult.data;
        console.log(`📊 Extracted data for ${file.name}:`, extractedData);

        if (!extractedData.po_number) {
          console.error(`❌ Missing PO number for ${file.name}`);
          results.push({
            fileName: file.name,
            isPO: true,
            extractedData,
            error: 'Missing required PO number',
            status: 'error'
          });
          continue;
        }

        // Step 3: Store in database
        console.log(`💾 Storing data for: ${file.name}`);
        const dbResult = await this.storeInDatabase(file.name, extractedData);
        console.log(`💾 Database result for ${file.name}:`, dbResult);
        results.push(dbResult);

      } catch (error) {
        console.error(`❌ Processing error for ${file.name}:`, error);
        results.push({
          fileName: file.name,
          isPO: false,
          error: error instanceof Error ? error.message : 'Processing failed',
          status: 'error'
        });
      }
    }

    console.log(`✅ Processing complete. Results:`, results);
    return results;
  }

  private async storeInDatabase(fileName: string, extractedData: any) {
    try {
      console.log(`💾 Preparing to store data for ${fileName}:`, extractedData);
      
      // Ensure po_number is a number
      let poNumber = extractedData.po_number;
      if (typeof poNumber === 'string') {
        poNumber = parseInt(poNumber, 10);
      }
      
      if (isNaN(poNumber)) {
        throw new Error('Invalid PO number format');
      }

      const poRecord = {
        file_name: fileName,
        po_number: poNumber,
        po_date: extractedData.po_date || null,
        vendor_code: extractedData.vendor_code || null,
        gstn: extractedData.gstn || null,
        project: extractedData.project || null,
        bill_to_address: extractedData.bill_to_address || null,
        ship_to: extractedData.ship_to || null,
        del_start_date: extractedData.del_start_date || null,
        del_end_date: extractedData.del_end_date || null,
        terms_conditions: extractedData.terms_conditions || null,
        description: Array.isArray(extractedData.description) ? extractedData.description : []
      };

      console.log(`💾 Inserting PO record:`, poRecord);

      const { data: insertData, error: insertError } = await supabase
        .from('po_table')
        .insert(poRecord)
        .select();

      if (insertError) {
        console.error(`❌ Database insert error for ${fileName}:`, insertError);
        return {
          fileName,
          isPO: true,
          extractedData,
          error: `Database error: ${insertError.message}`,
          status: 'error'
        };
      }

      console.log(`✅ Successfully stored ${fileName} in database:`, insertData);
      return {
        fileName,
        isPO: true,
        extractedData,
        dbRecord: insertData?.[0],
        status: 'success'
      };
    } catch (error) {
      console.error(`❌ Database storage error for ${fileName}:`, error);
      return {
        fileName,
        isPO: true,
        extractedData,
        error: error instanceof Error ? error.message : 'Database exception',
        status: 'error'
      };
    }
  }
}
