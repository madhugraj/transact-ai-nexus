
import { PODetectionAgent } from '@/services/agents/PODetectionAgent';
import { PODataExtractionAgent } from '@/services/agents/PODataExtractionAgent';
import { supabase } from '@/integrations/supabase/client';

export class POProcessor {
  private poDetectionAgent = new PODetectionAgent();
  private poDataExtractionAgent = new PODataExtractionAgent();

  async processFiles(files: File[]): Promise<any[]> {
    console.log(`🚀 POProcessor: Starting to process ${files.length} files`);
    console.log(`📋 POProcessor: Files to process:`, files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    const results = [];

    for (const [index, file] of files.entries()) {
      console.log(`\n=== PROCESSING FILE ${index + 1}/${files.length} ===`);
      console.log(`📄 POProcessor: Processing file: ${file.name}`);
      console.log(`📄 POProcessor: File details - Size: ${file.size} bytes, Type: ${file.type}`);
      
      try {
        // Validate file before processing
        if (!this.validateFile(file)) {
          console.error(`❌ POProcessor: File validation failed for ${file.name}`);
          results.push({
            fileName: file.name,
            isPO: false,
            error: 'Invalid file format or corrupted file',
            status: 'error'
          });
          continue;
        }

        // Step 1: Detect if it's a PO
        console.log(`🔍 POProcessor: Starting PO detection for: ${file.name}`);
        const detectionResult = await this.poDetectionAgent.process(file);
        console.log(`🔍 POProcessor: Detection result for ${file.name}:`, JSON.stringify(detectionResult, null, 2));
        
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

        // Step 2: Extract PO data using Gemini AI
        console.log(`📊 POProcessor: Starting data extraction for: ${file.name}`);
        const extractionResult = await this.poDataExtractionAgent.process(file);
        console.log(`📊 POProcessor: Extraction result for ${file.name}:`, JSON.stringify(extractionResult, null, 2));
        
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
        console.log(`📊 POProcessor: Extracted data for ${file.name}:`, JSON.stringify(extractedData, null, 2));

        // Validate extracted data
        if (!this.validateExtractedData(extractedData)) {
          console.error(`❌ POProcessor: Extracted data validation failed for ${file.name}`);
          results.push({
            fileName: file.name,
            isPO: true,
            error: 'Extracted data is invalid or incomplete',
            status: 'error'
          });
          continue;
        }

        // Step 3: Store in database
        console.log(`💾 POProcessor: Storing data for: ${file.name}`);
        const dbResult = await this.storeInDatabase(file.name, extractedData);
        console.log(`💾 POProcessor: Database result for ${file.name}:`, JSON.stringify(dbResult, null, 2));
        results.push(dbResult);

      } catch (error) {
        console.error(`❌ POProcessor: Processing error for ${file.name}:`, error);
        console.error(`❌ POProcessor: Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
        results.push({
          fileName: file.name,
          isPO: false,
          error: error instanceof Error ? error.message : 'Processing failed',
          status: 'error'
        });
      }
    }

    console.log(`\n=== PROCESSING COMPLETE ===`);
    console.log(`✅ POProcessor: Processing complete. Total results:`, results.length);
    console.log(`📊 POProcessor: Results summary:`, results.map(r => ({ 
      file: r.fileName, 
      status: r.status, 
      isPO: r.isPO,
      error: r.error 
    })));
    return results;
  }

  private validateFile(file: File): boolean {
    console.log(`🔍 POProcessor: Validating file: ${file.name}`);
    
    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      console.error(`❌ POProcessor: File too large: ${file.size} bytes`);
      return false;
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      console.error(`❌ POProcessor: Invalid file type: ${file.type}`);
      return false;
    }

    // Check if file is empty
    if (file.size === 0) {
      console.error(`❌ POProcessor: File is empty`);
      return false;
    }

    console.log(`✅ POProcessor: File validation passed for: ${file.name}`);
    return true;
  }

  private validateExtractedData(data: any): boolean {
    console.log(`🔍 POProcessor: Validating extracted data:`, data);
    
    if (!data || typeof data !== 'object') {
      console.error(`❌ POProcessor: Data is not an object`);
      return false;
    }

    // Check if we have at least some meaningful data
    const hasAnyData = data.po_number || 
                      data.vendor_code || 
                      data.bill_to_address ||
                      data.terms_conditions ||
                      (data.description && Array.isArray(data.description) && data.description.length > 0);

    if (!hasAnyData) {
      console.error(`❌ POProcessor: No meaningful data extracted`);
      return false;
    }

    console.log(`✅ POProcessor: Data validation passed`);
    return true;
  }

  private async storeInDatabase(fileName: string, extractedData: any) {
    try {
      console.log(`💾 POProcessor: Preparing to store data for ${fileName}`);
      console.log(`💾 POProcessor: Data to store:`, JSON.stringify(extractedData, null, 2));
      
      // Handle PO number with improved logic
      let poNumber = extractedData.po_number;
      
      if (typeof poNumber === 'string') {
        // Try to extract number from string, but also accept alphanumeric
        const numberMatch = poNumber.match(/\d+/);
        if (numberMatch) {
          poNumber = parseInt(numberMatch[0], 10);
        } else {
          // If no numbers found, generate a hash-based number from the string
          let hash = 0;
          for (let i = 0; i < poNumber.length; i++) {
            const char = poNumber.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
          }
          poNumber = Math.abs(hash);
          console.log(`⚠️ POProcessor: Generated numeric PO number from string: ${poNumber}`);
        }
      } else if (!poNumber || isNaN(poNumber)) {
        // Generate a unique number based on filename and timestamp
        let hash = 0;
        const str = fileName + Date.now().toString();
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        poNumber = Math.abs(hash);
        console.log(`⚠️ POProcessor: Generated unique PO number: ${poNumber} for ${fileName}`);
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

      console.log(`💾 POProcessor: Inserting PO record:`, JSON.stringify(poRecord, null, 2));

      // Fixed database connection test - use proper syntax
      console.log(`🔍 POProcessor: Testing database connection...`);
      const { data: testData, error: testError } = await supabase
        .from('po_table')
        .select('id')
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
