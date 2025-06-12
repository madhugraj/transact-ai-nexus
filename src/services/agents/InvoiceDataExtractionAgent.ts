
import { Agent, AgentResult } from './types';
import { processImageWithGemini } from '@/services/api/geminiService';

export class InvoiceDataExtractionAgent implements Agent {
  id = 'invoice-data-extraction';
  name = 'Invoice Data Extraction Agent';
  description = 'Extracts structured data from invoices using Gemini Vision AI with enhanced PO number detection';

  canProcess(data: any): boolean {
    // Can process File objects or base64 image data
    return data instanceof File || (typeof data === 'string' && data.startsWith('data:image'));
  }

  async process(file: File, customPrompt?: string): Promise<AgentResult> {
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
      
      // Use custom prompt if provided, otherwise use default enhanced prompt
      const prompt = customPrompt || this.getDefaultExtractionPrompt();
      
      console.log(`📊 Using ${customPrompt ? 'CUSTOM' : 'DEFAULT'} extraction prompt`);
      console.log(`📊 Prompt length: ${prompt.length} characters`);
      
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
      
      // Enhanced PO number validation and extraction
      this.validateAndEnhancePOExtraction(response.data, extractedData, file.name);
      
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
          poNumberFound: !!extractedData.po_number,
          usedCustomPrompt: !!customPrompt
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

  private getDefaultExtractionPrompt(): string {
    return `You are an expert invoice data extraction system. Extract ALL the following information from this invoice document.

REQUIRED FIELDS TO EXTRACT:
- invoice_number: The invoice number/ID
- invoice_date: Date of the invoice (YYYY-MM-DD format)
- supplier_gst_number: GST/Tax number of the supplier/seller
- bill_to_gst_number: GST/Tax number of the buyer/bill-to party
- po_number: Purchase Order number - This is ABSOLUTELY CRITICAL to find
- shipping_address: Complete shipping/delivery address
- seal_and_sign_present: Boolean - true if you detect any seal, stamp, or signature on the document
- line_items: Array of items with the following for each:
  - description: Item description
  - hsn_sac: HSN/SAC code if available
  - quantity: Quantity ordered
  - unit_price: Price per unit
  - total_amount: Total amount for this line item
  - serial_number: Serial number if available

CRITICAL - PO NUMBER EXTRACTION IS ABSOLUTELY ESSENTIAL:
The Purchase Order (PO) number is the MOST IMPORTANT field to extract. Look for these patterns:

EXACT PATTERNS TO SCAN FOR:
1. "P.O:" followed by any number or text (like "P.O: 25260168")
2. "P.O." followed by any number or text
3. "P.O " followed by any number or text (with space)
4. "PO:" followed by any number or text
5. "PO Number:" followed by any number or text
6. "Purchase Order:" followed by any number or text
7. "Order No:" followed by any number or text
8. "Buyer's Order:" followed by any number or text
9. Any field labeled with purchase order references

SCANNING STRATEGY - CHECK EVERY SECTION:
1. Document header area (top section)
2. Bill-to/Ship-to address blocks
3. Order details and reference sections
4. Table headers and cells
5. Footer area
6. Any "Reference" or "Details" sections
7. Vendor/supplier information areas

EXTRACTION RULES:
- Extract the EXACT alphanumeric value that follows these labels
- Remove prefixes like "P.O:", "Order:", "PO:" etc. - keep only the actual number
- The PO number can be purely numeric (like 25260168) or alphanumeric (like PO-2526-0168)
- If you find multiple potential PO numbers, choose the most prominent/official one
- Look very carefully - PO numbers can appear in unexpected locations

IMPORTANT INSTRUCTIONS:
1. Extract data EXACTLY as it appears in the document
2. For dates, convert to YYYY-MM-DD format
3. For amounts, extract only the numeric value (no currency symbols)
4. If a field is not found, use null
5. For seal_and_sign_present, carefully look for stamps, seals, signatures, or any authentication marks
6. PO NUMBER IS CRITICAL - Take extra time to scan the entire document thoroughly
7. Be systematic - scan every text element for PO patterns

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

Remember: The PO number extraction is ABSOLUTELY CRITICAL. Scan every part of the document systematically and look for ALL possible PO number patterns.`;
  }

  private validateAndEnhancePOExtraction(rawResponse: string, extractedData: any, fileName: string): void {
    console.log(`📊 ENHANCED PO Number validation for ${fileName}:`, {
      extracted_po_number: extractedData.po_number,
      po_number_type: typeof extractedData.po_number,
      po_number_length: extractedData.po_number?.length || 0,
      is_po_number_null: extractedData.po_number === null,
      is_po_number_empty: extractedData.po_number === ''
    });
    
    // Enhanced pattern matching for PO numbers in raw response
    const poPatterns = [
      /P\.O[:\.\s]+(\w+)/gi,
      /Purchase\s*Order[:\s]+(\w+)/gi,
      /Order\s*No[:\s]+(\w+)/gi,
      /PO[:\s]+(\w+)/gi,
      /Buyer['\s]*s?\s*Order[:\s]+(\w+)/gi,
      /Work\s*Order[:\s]+(\w+)/gi,
      /Reference[:\s]+(\w+)/gi
    ];
    
    let foundPOInRaw = null;
    let matchedPattern = null;
    
    for (let i = 0; i < poPatterns.length; i++) {
      const pattern = poPatterns[i];
      const matches = Array.from(rawResponse.matchAll(pattern));
      
      if (matches.length > 0) {
        for (const match of matches) {
          const potentialPO = match[1].trim();
          if (potentialPO && potentialPO.length > 0 && potentialPO !== '_number' && potentialPO !== 'null') {
            foundPOInRaw = potentialPO;
            matchedPattern = pattern.source;
            console.log(`📊 Found PO in raw using pattern ${i}: ${pattern.source} -> ${foundPOInRaw}`);
            break;
          }
        }
        if (foundPOInRaw) break;
      }
    }
    
    // If we found a PO in raw but not in extracted data, or if extracted is invalid
    if (foundPOInRaw && (!extractedData.po_number || extractedData.po_number === 'null' || extractedData.po_number === '_number')) {
      console.log(`📊 Using PO found in raw response instead of extracted: ${foundPOInRaw}`);
      extractedData.po_number = foundPOInRaw;
    }
    
    console.log(`📊 Final PO number validation result:`, {
      finalPONumber: extractedData.po_number,
      foundInRaw: foundPOInRaw,
      matchedPattern: matchedPattern,
      extractionSuccessful: !!extractedData.po_number
    });
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
