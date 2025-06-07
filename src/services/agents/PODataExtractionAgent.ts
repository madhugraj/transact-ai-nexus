
import { fileToBase64 } from '@/services/api/gemini/fileUtils';

export class PODataExtractionAgent {
  async process(file: File): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log(`📊 PODataExtractionAgent: Processing file ${file.name} (${file.size} bytes) with Gemini AI`);
      
      // Validate file first
      if (!this.validateFile(file)) {
        return {
          success: false,
          error: 'Invalid file: File is empty, too large, or corrupted'
        };
      }
      
      // Check if it's a PDF file
      if (file.type === 'application/pdf') {
        console.log(`📄 PODataExtractionAgent: Processing PDF file ${file.name}`);
        
        // First, try to convert PDF to base64 and send directly to Gemini
        try {
          const base64Data = await fileToBase64(file);
          console.log(`📊 PODataExtractionAgent: PDF converted to base64, size: ${base64Data.length} chars`);
          
          // Try direct PDF processing with Gemini first
          const extractedData = await this.extractPODataWithGemini(base64Data, file.type, file.name);
          
          if (extractedData.success && this.hasValidData(extractedData.data)) {
            console.log(`✅ PODataExtractionAgent: Direct PDF processing successful for ${file.name}`);
            return extractedData;
          }
          
          console.log(`⚠️ PODataExtractionAgent: Direct PDF processing failed or returned invalid data, trying image conversion for ${file.name}`);
        } catch (error) {
          console.error(`❌ PODataExtractionAgent: Direct PDF processing error for ${file.name}:`, error);
        }
        
        // Fallback: Try PDF to image conversion
        const imageData = await this.convertPdfToImage(file);
        
        if (!imageData) {
          console.error(`❌ PODataExtractionAgent: All PDF processing methods failed for ${file.name}`);
          return { 
            success: false, 
            error: 'Unable to process PDF file. The file may be corrupted, password-protected, or invalid.' 
          };
        }
        
        // Extract PO data using Gemini AI with converted image
        const extractedData = await this.extractPODataWithGemini(imageData.base64, imageData.mimeType, file.name);
        
        if (!extractedData.success) {
          console.error(`❌ PODataExtractionAgent: Gemini extraction failed for ${file.name}:`, extractedData.error);
          return extractedData;
        }
        
        console.log(`📊 PODataExtractionAgent: Successfully extracted data for ${file.name}:`, extractedData.data);
        
        return {
          success: true,
          data: extractedData.data
        };
      } else {
        // For image files, convert directly to base64
        const base64Data = await fileToBase64(file);
        console.log(`📊 PODataExtractionAgent: Image file converted to base64`);
        
        // Extract PO data using Gemini AI
        const extractedData = await this.extractPODataWithGemini(base64Data, file.type, file.name);
        
        if (!extractedData.success) {
          console.error(`❌ PODataExtractionAgent: Gemini extraction failed for ${file.name}:`, extractedData.error);
          return extractedData;
        }
        
        console.log(`📊 PODataExtractionAgent: Successfully extracted data for ${file.name}:`, extractedData.data);
        
        return {
          success: true,
          data: extractedData.data
        };
      }
    } catch (error) {
      console.error(`❌ PODataExtractionAgent error for ${file.name}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Data extraction failed'
      };
    }
  }

  private validateFile(file: File): boolean {
    console.log(`🔍 PODataExtractionAgent: Validating file ${file.name}: size=${file.size}, type=${file.type}`);
    
    // Check if file exists and has content
    if (!file || file.size === 0) {
      console.error(`❌ File is empty or doesn't exist`);
      return false;
    }
    
    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      console.error(`❌ File too large: ${file.size} bytes`);
      return false;
    }
    
    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      console.error(`❌ Invalid file type: ${file.type}`);
      return false;
    }
    
    console.log(`✅ File validation passed`);
    return true;
  }

  private hasValidData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    
    // Check if we have at least some meaningful data
    const hasAnyData = data.po_number || 
                      data.vendor_code || 
                      data.bill_to_address ||
                      data.terms_conditions ||
                      (data.description && Array.isArray(data.description) && data.description.length > 0);
    
    return hasAnyData;
  }
  
  private async convertPdfToImage(file: File): Promise<{ base64: string; mimeType: string } | null> {
    try {
      console.log(`🔄 PODataExtractionAgent: Starting PDF to image conversion for ${file.name}`);
      
      // Use PDF.js to convert PDF to canvas/image
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Enhanced validation for PDF structure
      if (arrayBuffer.byteLength < 100) {
        console.error(`❌ PODataExtractionAgent: PDF file too small: ${arrayBuffer.byteLength} bytes`);
        return null;
      }
      
      // Check for PDF header with more flexible matching
      const header = new Uint8Array(arrayBuffer.slice(0, 10));
      const headerString = String.fromCharCode(...header);
      if (!headerString.includes('%PDF')) {
        console.error(`❌ PODataExtractionAgent: Invalid PDF header: ${headerString}`);
        return null;
      }
      
      try {
        const pdf = await pdfjsLib.getDocument({ 
          data: arrayBuffer,
          verbosity: 0, // Reduce console noise
          stopAtErrors: false, // Continue processing even with minor errors
          isEvalSupported: false, // Disable eval for security
          disableFontFace: true, // Disable font loading
          disableRange: false,
          disableStream: false
        }).promise;
        
        console.log(`📄 PODataExtractionAgent: PDF loaded with ${pdf.numPages} pages`);
        
        if (pdf.numPages === 0) {
          console.error(`❌ PODataExtractionAgent: PDF has no pages`);
          return null;
        }
        
        // Get the first page
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        // Convert canvas to base64
        const base64 = canvas.toDataURL('image/png').split(',')[1];
        
        console.log(`✅ PODataExtractionAgent: Successfully converted PDF to image for ${file.name}`);
        
        return {
          base64,
          mimeType: 'image/png'
        };
      } catch (pdfError) {
        console.error(`❌ PODataExtractionAgent: PDF.js processing error:`, pdfError);
        return null;
      }
    } catch (error) {
      console.error(`❌ PODataExtractionAgent: PDF conversion error for ${file.name}:`, error);
      return null;
    }
  }
  
  private async extractPODataWithGemini(base64Data: string, mimeType: string, fileName: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const prompt = `
You are an expert document analysis AI specializing in Purchase Order extraction.

CRITICAL INSTRUCTIONS:
1. Analyze this document thoroughly - it should contain Purchase Order information
2. Extract ALL available business data, even if some fields are missing
3. Look for ANY identifying numbers (PO#, Order#, Doc#, Reference#, Invoice#, etc.)
4. Be very flexible and generous in your interpretation
5. Focus on extracting meaningful structured data

DETAILED EXTRACTION GUIDE:
- PO NUMBER: Look for ANY document reference number, order number, or identifier
- DATES: Convert to YYYY-MM-DD format, look for order dates, delivery dates
- VENDOR: Extract supplier/vendor company name and details
- ADDRESSES: Extract billing and shipping addresses
- LINE ITEMS: Extract all items with quantities, prices, descriptions
- TERMS: Payment terms, delivery conditions, special instructions

REQUIRED JSON FORMAT (return ONLY this JSON):
{
  "po_number": "document identifier found",
  "po_date": "YYYY-MM-DD or null",
  "vendor_code": "vendor/supplier name or code",
  "gstn": "tax/GST number if found",
  "project": "project name/reference",
  "bill_to_address": "complete billing address",
  "ship_to": "complete shipping address",
  "del_start_date": "delivery start date YYYY-MM-DD",
  "del_end_date": "delivery end date YYYY-MM-DD", 
  "terms_conditions": "payment terms and conditions",
  "description": [
    {
      "item": "item description",
      "quantity": 1,
      "unit_price": 100,
      "total": 100
    }
  ]
}

EXTRACTION STRATEGY:
- If you find a document number like "PO_25260168" extract "25260168" as po_number
- If you find company names, put them in vendor_code
- Extract addresses even if partial
- Look for tables with items, quantities, and prices
- Include ANY structured data you can identify
- Don't return all null values unless document is completely unreadable

Return ONLY the JSON object with extracted data.
`;

      console.log(`🤖 PODataExtractionAgent: Sending request to Gemini for ${fileName}`);
      
      // Use Gemini API key from environment or localStorage
      const apiKey = typeof window !== 'undefined' 
        ? localStorage.getItem('GEMINI_API_KEY') || 'AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk'
        : 'AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk';

      // Clean base64 data
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');

      // Call the Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: cleanBase64
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 4096,
              topP: 0.8,
              topK: 40
            }
          })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ PODataExtractionAgent: Gemini API error:`, errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      console.log(`🤖 PODataExtractionAgent: Raw Gemini response for ${fileName}:`, responseText);
      
      if (!responseText || responseText.trim() === '') {
        throw new Error("Empty response from Gemini API");
      }
      
      // Extract JSON from response text
      let parsedData;
      
      try {
        // Try direct JSON parsing first
        parsedData = JSON.parse(responseText.trim());
      } catch (e) {
        console.log(`🔄 PODataExtractionAgent: Direct JSON parse failed, trying extraction methods...`);
        
        // Try extracting JSON from code blocks
        const codeBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          try {
            parsedData = JSON.parse(codeBlockMatch[1]);
          } catch (e2) {
            console.log(`🔄 PODataExtractionAgent: Code block extraction failed`);
          }
        }
        
        // Try finding JSON object with regex
        if (!parsedData) {
          const jsonMatch = responseText.match(/\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/);
          if (jsonMatch) {
            try {
              parsedData = JSON.parse(jsonMatch[0]);
            } catch (e3) {
              console.log(`🔄 PODataExtractionAgent: Regex extraction failed`);
            }
          }
        }
        
        if (!parsedData) {
          throw new Error("Could not extract valid JSON from Gemini response");
        }
      }
      
      // Validate that we have some meaningful data
      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error("Invalid data structure from Gemini");
      }
      
      console.log(`✅ PODataExtractionAgent: Successfully parsed data for ${fileName}:`, parsedData);
      
      return {
        success: true,
        data: {
          ...parsedData,
          extraction_confidence: this.hasValidData(parsedData) ? 'high' : 'low'
        }
      };
    } catch (error) {
      console.error(`❌ PODataExtractionAgent: Gemini processing error for ${fileName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gemini processing failed'
      };
    }
  }
}
