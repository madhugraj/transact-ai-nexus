
import React from 'react';
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
        const detectionResult = await this.poDetectionAgent.process(file);
        
        if (!detectionResult.success) {
          results.push({
            fileName: file.name,
            isPO: false,
            error: detectionResult.error || 'Detection failed',
            status: 'error'
          });
          continue;
        }

        const isPO = detectionResult.data?.is_po;
        
        if (!isPO) {
          results.push({
            fileName: file.name,
            isPO: false,
            reason: detectionResult.data?.reason,
            status: 'skipped'
          });
          continue;
        }

        // Step 2: Extract PO data
        const extractionResult = await this.poDataExtractionAgent.process(file);
        
        if (!extractionResult.success) {
          results.push({
            fileName: file.name,
            isPO: true,
            error: extractionResult.error || 'Data extraction failed',
            status: 'error'
          });
          continue;
        }

        const extractedData = extractionResult.data;

        if (!extractedData.po_number) {
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
        const dbResult = await this.storeInDatabase(file.name, extractedData);
        results.push(dbResult);

      } catch (error) {
        results.push({
          fileName: file.name,
          isPO: false,
          error: error instanceof Error ? error.message : 'Processing failed',
          status: 'error'
        });
      }
    }

    return results;
  }

  private async storeInDatabase(fileName: string, extractedData: any) {
    try {
      const poRecord = {
        file_name: fileName,
        po_number: typeof extractedData.po_number === 'string' ? 
          parseInt(extractedData.po_number) : extractedData.po_number,
        po_date: extractedData.po_date,
        vendor_code: extractedData.vendor_code,
        gstn: extractedData.gstn,
        project: extractedData.project,
        bill_to_address: extractedData.bill_to_address,
        ship_to: extractedData.ship_to,
        del_start_date: extractedData.del_start_date,
        del_end_date: extractedData.del_end_date,
        terms_conditions: extractedData.terms_conditions,
        description: Array.isArray(extractedData.description) ? extractedData.description : []
      };

      const { data: insertData, error: insertError } = await supabase
        .from('po_table')
        .insert(poRecord)
        .select();

      if (insertError) {
        return {
          fileName,
          isPO: true,
          extractedData,
          error: `Database error: ${insertError.message}`,
          status: 'error'
        };
      }

      return {
        fileName,
        isPO: true,
        extractedData,
        dbRecord: insertData?.[0],
        status: 'success'
      };
    } catch (error) {
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
