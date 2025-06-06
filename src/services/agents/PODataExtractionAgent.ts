
import { Agent, AgentResult } from './types';
import { processImageWithGemini } from '@/services/api/geminiService';

export class PODataExtractionAgent implements Agent {
  id = 'po-data-extraction';
  name = 'Purchase Order Data Extraction Agent';
  description = 'Extracts structured data from Purchase Orders using Gemini Vision AI';

  canProcess(data: any): boolean {
    return data instanceof File || (typeof data === 'string' && data.startsWith('data:image'));
  }

  async process(file: File): Promise<AgentResult> {
    console.log(`📊 ${this.name}: Starting data extraction for ${file.name}`);
    
    try {
      const base64Image = await this.fileToBase64(file);
      
      const prompt = `
You are an expert PO data extraction system. Extract ALL the following information from this Purchase Order document.

REQUIRED FIELDS TO EXTRACT (matching po_table schema):
- po_number: Purchase Order number (numeric value only)
- po_date: Date of the PO (YYYY-MM-DD format)
- vendor_code: Vendor/supplier code
- gstn: GST number of vendor
- project: Project name/code if mentioned
- bill_to_address: Complete billing address
- ship_to: Complete shipping address
- del_start_date: Delivery start date (YYYY-MM-DD format)
- del_end_date: Delivery end date (YYYY-MM-DD format)
- terms_conditions: Terms and conditions text
- description: Array of line items with details

IMPORTANT INSTRUCTIONS:
1. Extract data EXACTLY as it appears in the document
2. For dates, convert to YYYY-MM-DD format
3. For po_number, extract only the numeric value
4. If a field is not found, use null
5. For description, create an array of objects with item details

Respond with ONLY a JSON object in this exact format:
{
  "po_number": number or null,
  "po_date": "YYYY-MM-DD or null",
  "vendor_code": "string or null",
  "gstn": "string or null",
  "project": "string or null",
  "bill_to_address": "string or null",
  "ship_to": "string or null",
  "del_start_date": "YYYY-MM-DD or null",
  "del_end_date": "YYYY-MM-DD or null",
  "terms_conditions": "string or null",
  "description": [
    {
      "item_description": "string",
      "quantity": number,
      "unit_price": number,
      "total_amount": number
    }
  ],
  "extraction_confidence": 0.0-1.0
}
`;

      const response = await processImageWithGemini(prompt, base64Image, file.type);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to extract PO data');
      }

      const extractedData = this.parseGeminiResponse(response.data || '');
      
      console.log(`✅ ${this.name}: Data extraction complete`);
      
      return {
        success: true,
        data: extractedData,
        agent: this.id,
        metadata: {
          fileType: file.type,
          fileSize: file.size,
          fileName: file.name,
          extractedFields: Object.keys(extractedData).length
        }
      };
      
    } catch (error) {
      console.error(`❌ ${this.name}: Error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        agent: this.id
      };
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  }

  private parseGeminiResponse(responseText: string): any {
    try {
      const parsed = JSON.parse(responseText.trim());
      return parsed;
    } catch (error) {
      const codeBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i;
      const codeBlockMatch = responseText.match(codeBlockRegex);
      
      if (codeBlockMatch) {
        try {
          return JSON.parse(codeBlockMatch[1].trim());
        } catch (error) {
          console.error('Failed to parse JSON from code block:', error);
        }
      }
      
      throw new Error('Unable to extract valid JSON from response');
    }
  }
}
