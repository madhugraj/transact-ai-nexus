
import { Agent, AgentResult } from './types';
import { processImageWithGemini } from '@/services/api/geminiService';

export class InvoiceDataExtractionAgent implements Agent {
  id = 'invoice-data-extraction';
  name = 'Invoice Data Extraction Agent';
  description = 'Extracts structured data from invoices using Gemini Vision AI';

  async process(file: File): Promise<AgentResult> {
    console.log(`📊 ${this.name}: Starting data extraction for ${file.name}`);
    
    try {
      const base64Image = await this.fileToBase64(file);
      
      const prompt = `
You are an expert invoice data extraction system. Extract ALL the following information from this invoice document.

REQUIRED FIELDS TO EXTRACT:
- invoice_number: The invoice number/ID
- invoice_date: Date of the invoice (YYYY-MM-DD format)
- supplier_gst_number: GST/Tax number of the supplier/seller
- bill_to_gst_number: GST/Tax number of the buyer/bill-to party
- po_number: Purchase Order number (if mentioned)
- shipping_address: Complete shipping/delivery address
- seal_and_sign_present: Boolean - true if you detect any seal, stamp, or signature on the document
- line_items: Array of items with the following for each:
  - description: Item description
  - hsn_sac: HSN/SAC code if available
  - quantity: Quantity ordered
  - unit_price: Price per unit
  - total_amount: Total amount for this line item
  - serial_number: Serial number if available

IMPORTANT INSTRUCTIONS:
1. Extract data EXACTLY as it appears in the document
2. For dates, convert to YYYY-MM-DD format
3. For amounts, extract only the numeric value (no currency symbols)
4. If a field is not found, use null
5. For seal_and_sign_present, carefully look for stamps, seals, signatures, or any authentication marks

Respond with ONLY a JSON object in this exact format:
{
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "supplier_gst_number": "string or null",
  "bill_to_gst_number": "string or null", 
  "po_number": "string or null",
  "shipping_address": "string or null",
  "seal_and_sign_present": true/false,
  "line_items": [
    {
      "description": "string",
      "hsn_sac": "string or null",
      "quantity": number,
      "unit_price": number,
      "total_amount": number,
      "serial_number": "string or null"
    }
  ],
  "extraction_confidence": 0.0-1.0
}
`;

      const response = await processImageWithGemini(prompt, base64Image, file.type);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to extract invoice data');
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
