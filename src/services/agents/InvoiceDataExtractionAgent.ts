
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
- po_number: Purchase Order number - This is CRITICAL to find
- shipping_address: Complete shipping/delivery address
- seal_and_sign_present: Boolean - true if you detect any seal, stamp, or signature on the document
- line_items: Array of items with the following for each:
  - description: Item description
  - hsn_sac: HSN/SAC code if available
  - quantity: Quantity ordered
  - unit_price: Price per unit
  - total_amount: Total amount for this line item
  - serial_number: Serial number if available

CRITICAL - PO NUMBER EXTRACTION IS ESSENTIAL:
The Purchase Order (PO) number is ABSOLUTELY CRITICAL to find. It can appear as:
- "P.O:" followed by a number (like "P.O: 25260168")
- "P.O." followed by a number
- "P.O" followed by a number
- "PO Number:" followed by a number
- "Purchase Order No:" followed by a number
- "Order No:" followed by a number
- "Buyer's Order No:" followed by a number
- Any variation of the above

SCAN EVERY PART OF THE DOCUMENT FOR PO NUMBER:
1. Header section (top of document)
2. Bill-to/Ship-to address blocks
3. Order details section
4. Footer section
5. Any reference fields
6. Table headers or cells

SPECIFIC EXTRACTION RULES FOR PO NUMBER:
- Look for text patterns like "P.O: 25260168" and extract "25260168"
- Look for "Purchase Order: ABC123" and extract "ABC123" 
- Look for "Order No: 12345" and extract "12345"
- Remove prefixes like "P.O:", "Order:", "PO:" etc. - keep only the actual number
- The PO number can be purely numeric (like 25260168) or alphanumeric (like PO-2526-0168)
- If you find multiple potential PO numbers, choose the most prominent one

IMPORTANT INSTRUCTIONS:
1. Extract data EXACTLY as it appears in the document
2. For dates, convert to YYYY-MM-DD format
3. For amounts, extract only the numeric value (no currency symbols)
4. If a field is not found, use null
5. For seal_and_sign_present, carefully look for stamps, seals, signatures, or any authentication marks
6. PO NUMBER IS CRITICAL - Take extra time to scan the entire document thoroughly
7. Be very systematic in your search for the PO number

RESPONSE FORMAT - Respond with ONLY a JSON object:
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

Remember: The PO number extraction is CRITICAL. Scan every part of the document systematically.
`;

      console.log(`📊 Calling Gemini API with enhanced PO extraction prompt`);
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

      console.log(`📊 Raw Gemini response data for ${file.name}:`, response.data.substring(0, 1000));
      
      const extractedData = this.parseGeminiResponse(response.data);
      
      // Enhanced logging for PO number extraction
      console.log(`📊 ENHANCED PO Number extraction analysis for ${file.name}:`, {
        extracted_po_number: extractedData.po_number,
        po_number_type: typeof extractedData.po_number,
        po_number_length: extractedData.po_number?.length || 0,
        po_number_value: extractedData.po_number,
        is_po_number_null: extractedData.po_number === null,
        is_po_number_empty: extractedData.po_number === '',
        raw_gemini_response: response.data,
        full_extracted_data: JSON.stringify(extractedData, null, 2)
      });
      
      // Special check for PO number patterns in raw response
      const poPatterns = [
        /P\.O[:\.\s]*(\d+)/i,
        /Purchase\s*Order[:\s]*(\w+)/i,
        /Order\s*No[:\s]*(\w+)/i,
        /PO[:\s]*(\w+)/i
      ];
      
      let foundPOInRaw = null;
      for (const pattern of poPatterns) {
        const match = response.data.match(pattern);
        if (match) {
          foundPOInRaw = match[1];
          console.log(`📊 Found PO pattern in raw response: ${pattern} -> ${foundPOInRaw}`);
          break;
        }
      }
      
      if (foundPOInRaw && !extractedData.po_number) {
        console.log(`📊 PO found in raw but not in extracted data - using raw match: ${foundPOInRaw}`);
        extractedData.po_number = foundPOInRaw;
      }
      
      console.log(`📊 Successfully parsed extraction data for ${file.name}:`, {
        hasInvoiceNumber: !!extractedData.invoice_number,
        hasPONumber: !!extractedData.po_number,
        hasLineItems: extractedData.line_items?.length || 0,
        confidence: extractedData.extraction_confidence,
        finalPONumber: extractedData.po_number
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
          extractedFields: Object.keys(extractedData).length,
          poNumberFound: !!extractedData.po_number
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
