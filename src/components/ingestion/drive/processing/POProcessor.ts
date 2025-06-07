
import { PODetectionAgent } from '@/services/agents/PODetectionAgent';
import { PODataExtractionAgent } from '@/services/agents/PODataExtractionAgent';
import { supabase } from '@/integrations/supabase/client';

export class POProcessor {
  private poDetectionAgent = new PODetectionAgent();
  private poDataExtractionAgent = new PODataExtractionAgent();

  async processFiles(files: File[]): Promise<any[]> {
    console.log(`🚀 POProcessor: Starting to process ${files.length} files`);
    const results = [];

    for (const [index, file] of files.entries()) {
      console.log(`📄 POProcessor: Processing file ${index + 1}/${files.length}: ${file.name}`);
      
      try {
        // Step 1: Detect if it's a PO
        console.log(`🔍 POProcessor: Starting PO detection for: ${file.name}`);
        const detectionResult = await this.poDetectionAgent.process(file);
        console.log(`🔍 POProcessor: Detection result for ${file.name}:`, detectionResult);
        
        if (!detectionResult.success) {
          console.error(`❌ POProcessor: Detection failed for ${file.name}:`, detectionResult.error);
          results.push({
            fileName: file.name,
            isPO: false,
            error: detectionResult.error || 'Detection failed',
            status: 'error'
          });
          continue;
        }

        const isPO = detectionResult.data?.is_po;
        console.log(`📋 POProcessor: Is PO result: ${isPO} for file: ${file.name}`);
        
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
        console.log(`📊 POProcessor: Starting data extraction for: ${file.name}`);
        const extractionResult = await this.poDataExtractionAgent.process(file);
        console.log(`📊 POProcessor: Extraction result for ${file.name}:`, extractionResult);
        
        if (!extractionResult.success) {
          console.error(`❌ POProcessor: Data extraction failed for ${file.name}:`, extractionResult.error);
          results.push({
            fileName: file.name,
            isPO: true,
            error: extractionResult.error || 'Data extraction failed',
            status: 'error'
          });
          continue;
        }

        const extractedData = extractionResult.data;
        console.log(`📊 POProcessor: Extracted data for ${file.name}:`, extractedData);

        // Enhanced validation - allow processing even with limited data
        if (!extractedData.po_number && !extractedData.bill_to_address && !extractedData.vendor_code) {
          console.warn(`⚠️ POProcessor: Limited data extracted for ${file.name}, but continuing with processing`);
        }

        // Step 3: Store in database
        console.log(`💾 POProcessor: Storing data for: ${file.name}`);
        const dbResult = await this.storeInDatabase(file.name, extractedData);
        console.log(`💾 POProcessor: Database result for ${file.name}:`, dbResult);
        results.push(dbResult);

      } catch (error) {
        console.error(`❌ POProcessor: Processing error for ${file.name}:`, error);
        results.push({
          fileName: file.name,
          isPO: false,
          error: error instanceof Error ? error.message : 'Processing failed',
          status: 'error'
        });
      }
    }

    console.log(`✅ POProcessor: Processing complete. Total results:`, results.length);
    console.log(`📊 POProcessor: Results summary:`, results);
    return results;
  }

  private async storeInDatabase(fileName: string, extractedData: any) {
    try {
      console.log(`💾 POProcessor: Preparing to store data for ${fileName}`);
      console.log(`💾 POProcessor: Data to store:`, extractedData);
      
      // Handle PO number - be more flexible
      let poNumber = extractedData.po_number;
      if (typeof poNumber === 'string') {
        // Try to extract number from string
        const numberMatch = poNumber.match(/\d+/);
        if (numberMatch) {
          poNumber = parseInt(numberMatch[0], 10);
        } else {
          console.warn(`⚠️ POProcessor: Could not extract number from PO number: ${poNumber}, using timestamp as fallback`);
          poNumber = Date.now(); // Use timestamp as fallback
        }
      } else if (!poNumber) {
        console.warn(`⚠️ POProcessor: No PO number found, using timestamp as fallback`);
        poNumber = Date.now(); // Use timestamp as fallback
      }
      
      if (isNaN(poNumber)) {
        console.warn(`⚠️ POProcessor: Invalid PO number, using timestamp as fallback`);
        poNumber = Date.now();
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

      console.log(`💾 POProcessor: Inserting PO record:`, poRecord);

      // Test database connection first
      console.log(`🔍 POProcessor: Testing database connection...`);
      const { data: testData, error: testError } = await supabase
        .from('po_table')
        .select('count(*)')
        .limit(1);

      if (testError) {
        console.error(`❌ POProcessor: Database connection test failed:`, testError);
        throw new Error(`Database connection failed: ${testError.message}`);
      }

      console.log(`✅ POProcessor: Database connection test successful`);

      const { data: insertData, error: insertError } = await supabase
        .from('po_table')
        .insert(poRecord)
        .select();

      if (insertError) {
        console.error(`❌ POProcessor: Database insert error for ${fileName}:`, insertError);
        return {
          fileName,
          isPO: true,
          extractedData,
          error: `Database error: ${insertError.message}`,
          status: 'error'
        };
      }

      console.log(`✅ POProcessor: Successfully stored ${fileName} in database:`, insertData);
      return {
        fileName,
        isPO: true,
        extractedData,
        dbRecord: insertData?.[0],
        status: 'success'
      };
    } catch (error) {
      console.error(`❌ POProcessor: Database storage error for ${fileName}:`, error);
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
