
import { Agent, AgentResult } from './types';
import { processImageWithGemini } from '@/services/api/geminiService';

export class InvoiceDataExtractionAgent implements Agent {
  id = 'invoice-data-extraction';
  name = 'Invoice Data Extraction Agent';
  description = 'Extracts structured data from invoices using Gemini Vision AI';

  canProcess(data: any): boolean {
    // Can process File objects or base64 image data
    return data instanceof File || (typeof data === 'string' && data.startsWith('data:image'));
  }

  async process(file: File): Promise<AgentResult> {
    console.log(`📊 ${this.name}: Starting data extraction for ${file.name}`);
    console.log(`📊 File details: size=${file.size}, type=${file.type}`);
    
    try {
      const base64Image = await this.fileToBase64(file);
      console.log(`📊 Successfully converted to base64, length: ${base64Image.length}`);
      
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

      console.log(`📊 Calling Gemini API with prompt length: ${prompt.length}`);
      const response = await processImageWithGemini(prompt, base64Image, file.type);
      
      console.log(`📊 Gemini API response:`, {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
        dataLength: response.data?.length
      });
      
      if (!response.success) {
        console.error(`📊 Gemini API failed:`, response.error);
        throw new Error(response.error || 'Failed to extract invoice data');
      }

      console.log(`📊 Raw Gemini response data:`, response.data?.substring(0, 500) + '...');
      
      const extractedData = this.parseGeminiResponse(response.data || '');
      
      console.log(`📊 Parsed extraction data:`, extractedData);
      console.log(`✅ ${this.name}: Data extraction complete for ${file.name}`);
      
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
      console.error(`❌ ${this.name}: Error processing ${file.name}:`, error);
      console.error(`❌ Full error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
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
        console.log(`📊 File to base64 conversion successful, length: ${base64Data.length}`);
        resolve(base64Data);
      };
      reader.onerror = error => {
        console.error('📊 File to base64 conversion failed:', error);
        reject(error);
      };
    });
  }

  private parseGeminiResponse(responseText: string): any {
    console.log(`📊 Parsing Gemini response, length: ${responseText.length}`);
    console.log(`📊 Raw response text:`, responseText.substring(0, 1000));
    
    try {
      const parsed = JSON.parse(responseText.trim());
      console.log(`📊 Direct JSON parsing successful:`, parsed);
      return parsed;
    } catch (error) {
      console.log(`📊 Direct JSON parsing failed, trying code block extraction...`);
    }
    
    const codeBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i;
    const codeBlockMatch = responseText.match(codeBlockRegex);
    
    if (codeBlockMatch) {
      try {
        const extractedJson = JSON.parse(codeBlockMatch[1].trim());
        console.log(`📊 Successfully extracted JSON from code block:`, extractedJson);
        return extractedJson;
      } catch (error) {
        console.error('📊 Failed to parse JSON from code block:', error);
      }
    }
    
    // Try to find any JSON-like structure
    const jsonRegex = /\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/;
    const jsonMatch = responseText.match(jsonRegex);
    
    if (jsonMatch) {
      try {
        const extractedJson = JSON.parse(jsonMatch[0]);
        console.log(`📊 Successfully extracted JSON using regex:`, extractedJson);
        return extractedJson;
      } catch (error) {
        console.error('📊 Failed to parse extracted JSON:', error);
      }
    }
    
    console.error('📊 All parsing methods failed for response:', responseText);
    throw new Error('Unable to extract valid JSON from Gemini response');
  }
}
