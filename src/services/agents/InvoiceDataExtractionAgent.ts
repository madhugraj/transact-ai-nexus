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
      // Check if file is valid
      if (!file || file.size === 0) {
        console.error(`📊 Invalid file: ${file.name}, size: ${file.size}`);
        throw new Error(`Invalid file: ${file.name}`);
      }

      console.log(`📊 Converting file to base64: ${file.name}`);
      const base64Image = await this.fileToBase64(file);
      console.log(`📊 Successfully converted to base64, length: ${base64Image.length}`);
      
      const prompt = `
You are an expert invoice data extraction system. Extract ALL the following information from this invoice document.

REQUIRED FIELDS TO EXTRACT:
- invoice_number: The invoice number/ID
- invoice_date: Date of the invoice (YYYY-MM-DD format)
- supplier_gst_number: GST/Tax number of the supplier/seller
- bill_to_gst_number: GST/Tax number of the buyer/bill-to party
- po_number: Purchase Order number - Look for ANY of these patterns and labels
- shipping_address: Complete shipping/delivery address
- seal_and_sign_present: Boolean - true if you detect any seal, stamp, or signature on the document
- line_items: Array of items with the following for each:
  - description: Item description
  - hsn_sac: HSN/SAC code if available
  - quantity: Quantity ordered
  - unit_price: Price per unit
  - total_amount: Total amount for this line item
  - serial_number: Serial number if available

CRITICAL INSTRUCTIONS FOR PO NUMBER EXTRACTION:
1. Look for ANY field that contains purchase order or order references
2. Common field labels to scan for:
   - "P.O:" or "P.O." or "P.O" (with or without spaces)
   - "PO Number" or "PO No" or "PO#"
   - "Purchase Order" or "Purchase Order No"
   - "Order No" or "Order Number" or "Order#"
   - "Buyer's Order No" or "Buyer Order"
   - "Ref No" or "Reference Number" or "Ref#"
   - "Work Order" or "WO"
3. The PO number can appear ANYWHERE on the invoice - header, footer, or within tables
4. Extract the EXACT alphanumeric value that follows these labels
5. Common formats: numbers only (like "25260168"), alphanumeric (like "PO-2526-0168"), or with prefixes
6. Remove any prefixes from the extracted value (like "PO:", "Order:", etc.) - keep only the actual number/code
7. If multiple order references exist, prioritize the main purchase order number
8. Look carefully in ALL sections of the document including headers, bill-to sections, and item details

SCANNING STRATEGY FOR PO NUMBER:
- First scan the top section/header area for "P.O:" type labels
- Then check bill-to/ship-to sections for order references
- Look in any reference or description fields
- Check footer areas for order information
- Examine any table headers or additional info sections

IMPORTANT INSTRUCTIONS:
1. Extract data EXACTLY as it appears in the document
2. For dates, convert to YYYY-MM-DD format
3. For amounts, extract only the numeric value (no currency symbols)
4. If a field is not found, use null
5. For seal_and_sign_present, carefully look for stamps, seals, signatures, or any authentication marks
6. PAY EXTRA ATTENTION to PO number extraction - it's critical for invoice processing
7. Be very thorough when scanning for PO numbers - they can be in unexpected locations

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
      console.log(`📊 File type being sent to Gemini: ${file.type}`);
      
      const response = await processImageWithGemini(prompt, base64Image, file.type);
      
      console.log(`📊 Gemini API response received:`, {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
        dataLength: response.data?.length,
        responsePreview: response.data?.substring(0, 200)
      });
      
      if (!response.success) {
        console.error(`📊 Gemini API failed for ${file.name}:`, response.error);
        return {
          success: false,
          error: response.error || 'Failed to extract invoice data',
          agent: this.id
        };
      }

      if (!response.data) {
        console.error(`📊 Gemini API returned no data for ${file.name}`);
        return {
          success: false,
          error: 'No data returned from Gemini API',
          agent: this.id
        };
      }

      console.log(`📊 Raw Gemini response data for ${file.name}:`, response.data.substring(0, 500) + '...');
      
      const extractedData = this.parseGeminiResponse(response.data);
      
      // Additional logging for PO number extraction
      console.log(`📊 DETAILED PO Number extraction result for ${file.name}:`, {
        extracted_po_number: extractedData.po_number,
        po_number_type: typeof extractedData.po_number,
        po_number_length: extractedData.po_number?.length || 0,
        po_number_value: extractedData.po_number,
        raw_extraction_preview: JSON.stringify(extractedData).substring(0, 300)
      });
      
      console.log(`📊 Successfully parsed extraction data for ${file.name}:`, {
        hasInvoiceNumber: !!extractedData.invoice_number,
        hasPONumber: !!extractedData.po_number,
        hasLineItems: extractedData.line_items?.length || 0,
        confidence: extractedData.extraction_confidence
      });
      
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
        stack: error instanceof Error ? error.stack : undefined,
        errorType: typeof error
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        agent: this.id
      };
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    console.log(`📊 Converting ${file.name} to base64...`);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        console.log(`📊 File to base64 conversion successful for ${file.name}, length: ${base64Data.length}`);
        resolve(base64Data);
      };
      reader.onerror = error => {
        console.error(`📊 File to base64 conversion failed for ${file.name}:`, error);
        reject(error);
      };
    });
  }

  private parseGeminiResponse(responseText: string): any {
    console.log(`📊 Parsing Gemini response, length: ${responseText.length}`);
    console.log(`📊 Raw response preview:`, responseText.substring(0, 500));
    
    try {
      // First try direct JSON parsing
      const trimmed = responseText.trim();
      const parsed = JSON.parse(trimmed);
      console.log(`📊 Direct JSON parsing successful`);
      return parsed;
    } catch (error) {
      console.log(`📊 Direct JSON parsing failed, trying code block extraction...`);
      console.log(`📊 Parse error:`, error instanceof Error ? error.message : error);
    }
    
    // Try to extract JSON from code blocks
    const codeBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i;
    const codeBlockMatch = responseText.match(codeBlockRegex);
    
    if (codeBlockMatch) {
      try {
        const extractedJson = JSON.parse(codeBlockMatch[1].trim());
        console.log(`📊 Successfully extracted JSON from code block`);
        return extractedJson;
      } catch (error) {
        console.error('📊 Failed to parse JSON from code block:', error);
      }
    }
    
    // Try to find any JSON-like structure using a more flexible regex
    const jsonRegex = /\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/;
    const jsonMatch = responseText.match(jsonRegex);
    
    if (jsonMatch) {
      try {
        const extractedJson = JSON.parse(jsonMatch[0]);
        console.log(`📊 Successfully extracted JSON using regex`);
        return extractedJson;
      } catch (error) {
        console.error('📊 Failed to parse extracted JSON:', error);
      }
    }
    
    console.error('📊 All parsing methods failed for response:', responseText.substring(0, 1000));
    throw new Error('Unable to extract valid JSON from Gemini response');
  }
}
