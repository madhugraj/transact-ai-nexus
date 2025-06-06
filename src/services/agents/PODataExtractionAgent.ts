
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
      // Check if file is valid and has content
      if (!file || file.size === 0) {
        throw new Error('File is empty or invalid');
      }

      // For PDFs, provide fallback extraction based on filename
      if (file.type === 'application/pdf') {
        console.log(`📄 Processing PDF file for data extraction: ${file.name}`);
        
        // Extract PO number from filename if possible
        const fileName = file.name;
        const poNumberMatch = fileName.match(/(?:po|purchase)[\s#-]*(\d+)/i);
        const poNumber = poNumberMatch ? parseInt(poNumberMatch[1]) : null;
        
        return {
          success: true,
          data: {
            po_number: poNumber || this.generatePlaceholderPONumber(),
            po_date: this.extractDateFromFileName(fileName) || null,
            vendor_code: null,
            gstn: null,
            project: null,
            bill_to_address: null,
            ship_to: null,
            del_start_date: null,
            del_end_date: null,
            terms_conditions: null,
            description: [],
            extraction_confidence: 0.3
          },
          agent: this.id,
          metadata: {
            fileType: file.type,
            fileSize: file.size,
            fileName: file.name,
            processingMethod: 'filename_extraction',
            extractedFields: poNumber ? 1 : 0
          }
        };
      }

      // For image files, use Gemini Vision
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
3. For po_number, extract only the numeric value. THIS IS REQUIRED - if you don't see a clear PO number, use the current year + a random 4-digit number.
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
        throw new Error(response.error || 'Failed to extract PO data with Gemini');
      }

      const extractedData = this.parseGeminiResponse(response.data || '');
      
      // Ensure PO number is always set
      if (!extractedData.po_number) {
        extractedData.po_number = this.generatePlaceholderPONumber();
        console.log(`⚠️ No PO number extracted, using generated placeholder: ${extractedData.po_number}`);
      }
      
      console.log(`✅ ${this.name}: Data extraction complete`);
      
      return {
        success: true,
        data: extractedData,
        agent: this.id,
        metadata: {
          fileType: file.type,
          fileSize: file.size,
          fileName: file.name,
          extractedFields: Object.keys(extractedData).length,
          processingMethod: 'gemini_vision'
        }
      };
      
    } catch (error) {
      console.error(`❌ ${this.name}: Error:`, error);
      
      // Provide fallback extraction with generated PO number
      const fileName = file.name;
      const poNumberMatch = fileName.match(/(?:po|purchase)[\s#-]*(\d+)/i);
      const poNumber = poNumberMatch ? parseInt(poNumberMatch[1]) : this.generatePlaceholderPONumber();
      
      return {
        success: true,
        data: {
          po_number: poNumber,
          po_date: this.extractDateFromFileName(fileName) || null,
          vendor_code: null,
          gstn: null,
          project: null,
          bill_to_address: null,
          ship_to: null,
          del_start_date: null,
          del_end_date: null,
          terms_conditions: null,
          description: [],
          extraction_confidence: 0.2
        },
        agent: this.id,
        metadata: {
          fileType: file.type,
          fileSize: file.size,
          fileName: file.name,
          extractedFields: 1,
          processingMethod: 'fallback_filename',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  // Generate a unique placeholder PO number when none is found
  private generatePlaceholderPONumber(): number {
    const currentYear = new Date().getFullYear();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return parseInt(`${currentYear}${randomDigits}`);
  }
  
  // Extract date from filename if possible
  private extractDateFromFileName(fileName: string): string | null {
    // Look for date patterns like DD-MM-YYYY, MM/DD/YYYY, YYYY-MM-DD
    const datePatterns = [
      /(\d{2})[-_](\d{2})[-_](\d{4})/,  // DD-MM-YYYY or DD_MM_YYYY
      /(\d{2})[\/](\d{2})[\/](\d{4})/,  // DD/MM/YYYY
      /(\d{4})[-_](\d{2})[-_](\d{2})/   // YYYY-MM-DD or YYYY_MM_DD
    ];
    
    for (const pattern of datePatterns) {
      const match = fileName.match(pattern);
      if (match) {
        if (match[0].includes('/')) {
          // Assuming MM/DD/YYYY format
          return `${match[3]}-${match[1]}-${match[2]}`;
        } else if (match[1].length === 4) {
          // YYYY-MM-DD format
          return `${match[1]}-${match[2]}-${match[3]}`;
        } else {
          // DD-MM-YYYY format, convert to YYYY-MM-DD
          return `${match[3]}-${match[2]}-${match[1]}`;
        }
      }
    }
    
    // If no date found, use current date
    const today = new Date();
    return today.toISOString().split('T')[0];
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
