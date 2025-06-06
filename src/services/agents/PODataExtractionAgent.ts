
import { fileToBase64 } from '@/services/api/gemini/fileUtils';

export class PODataExtractionAgent {
  async process(file: File): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log(`📊 PODataExtractionAgent: Processing file ${file.name} with Gemini AI`);
      
      // Check if it's a PDF file
      if (file.type === 'application/pdf') {
        console.log(`📄 PODataExtractionAgent: Converting PDF to images for ${file.name}`);
        const imageData = await this.convertPdfToImage(file);
        
        if (!imageData) {
          console.log(`📄 PODataExtractionAgent: PDF conversion failed, trying direct upload to Gemini for ${file.name}`);
          // Fallback: try sending PDF directly to Gemini
          const base64Data = await fileToBase64(file);
          const extractedData = await this.extractPODataWithGemini(base64Data, file.type, file.name);
          
          if (!extractedData.success) {
            console.error(`❌ PODataExtractionAgent: Both image conversion and direct PDF processing failed for ${file.name}`);
            return { success: false, error: 'Failed to process PDF file' };
          }
          
          return extractedData;
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
        console.log(`📊 PODataExtractionAgent: File converted to base64`);
        
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
  
  private async convertPdfToImage(file: File): Promise<{ base64: string; mimeType: string } | null> {
    try {
      console.log(`🔄 PODataExtractionAgent: Starting PDF to image conversion for ${file.name}`);
      
      // Use PDF.js to convert PDF to canvas/image
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Add validation for PDF structure
      if (arrayBuffer.byteLength < 100) {
        console.error(`❌ PODataExtractionAgent: PDF file too small: ${arrayBuffer.byteLength} bytes`);
        return null;
      }
      
      // Check for PDF header
      const header = new Uint8Array(arrayBuffer.slice(0, 5));
      const headerString = String.fromCharCode(...header);
      if (!headerString.startsWith('%PDF')) {
        console.error(`❌ PODataExtractionAgent: Invalid PDF header: ${headerString}`);
        return null;
      }
      
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0, // Reduce console noise
        stopAtErrors: false // Continue processing even with minor errors
      }).promise;
      
      console.log(`📄 PODataExtractionAgent: PDF loaded with ${pdf.numPages} pages`);
      
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
    } catch (error) {
      console.error(`❌ PODataExtractionAgent: PDF conversion error for ${file.name}:`, error);
      return null;
    }
  }
  
  private async extractPODataWithGemini(base64Data: string, mimeType: string, fileName: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const prompt = `
You are an expert OCR and data extraction AI. Please analyze this Purchase Order document and extract ALL the relevant information.

IMPORTANT INSTRUCTIONS:
1. Look carefully at the document - it contains a Purchase Order with structured data
2. Extract EVERY piece of information you can find, even if some fields are blank
3. For PO number: Look for patterns like "PO#", "Purchase Order No.", "Order No.", or similar
4. Convert all dates to YYYY-MM-DD format
5. For line items: Extract item description, quantity, unit price, and total for each row
6. If you cannot find a specific field, use null for that field
7. ALWAYS return valid JSON - never return empty objects

REQUIRED EXTRACTION FORMAT (return ONLY this JSON structure):
{
  "po_number": "extract the PO number as string, look for patterns like PO#, Order No, etc",
  "po_date": "YYYY-MM-DD format or null",
  "vendor_code": "vendor/supplier code if available or null",
  "gstn": "GST number if available or null", 
  "project": "project name/code if available or null",
  "bill_to_address": "full billing address or null",
  "ship_to": "full shipping address or null",
  "del_start_date": "delivery start date in YYYY-MM-DD or null",
  "del_end_date": "delivery end date in YYYY-MM-DD or null", 
  "terms_conditions": "payment terms and conditions or null",
  "description": [
    {
      "item": "item description",
      "quantity": number,
      "unit_price": number,
      "total": number
    }
  ]
}

Document Analysis Instructions:
- Look for headers like "Purchase Order", "PO#", "Order No"
- Check for vendor/supplier information
- Find delivery addresses and dates
- Extract all line items with quantities and prices
- Look for payment terms
- Extract GST/tax information

Return ONLY valid JSON with no additional text or explanations.
`;

      console.log(`🤖 PODataExtractionAgent: Sending request to Gemini for ${fileName}`);
      
      // Use Gemini API key from environment or localStorage
      const apiKey = typeof window !== 'undefined' 
        ? localStorage.getItem('GEMINI_API_KEY') || 'AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk'
        : 'AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk';

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
                      data: base64Data
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 4096
            }
          })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      console.log(`🤖 PODataExtractionAgent: Raw Gemini response for ${fileName}:`, responseText);
      
      if (!responseText || responseText.trim() === '') {
        throw new Error("Empty response from Gemini API");
      }
      
      // Extract JSON from response text - try multiple approaches
      let parsedData;
      
      // First try: direct JSON parsing
      try {
        parsedData = JSON.parse(responseText.trim());
      } catch (e) {
        console.log(`🔄 PODataExtractionAgent: Direct JSON parse failed, trying extraction methods...`);
        
        // Second try: extract JSON from code blocks
        const codeBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          try {
            parsedData = JSON.parse(codeBlockMatch[1]);
          } catch (e2) {
            console.log(`🔄 PODataExtractionAgent: Code block extraction failed`);
          }
        }
        
        // Third try: find JSON object with regex
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
      
      // Validate that we have some data
      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error("Invalid data structure from Gemini");
      }
      
      // Check if we have at least a PO number or some meaningful data
      if (!parsedData.po_number && !parsedData.description && !parsedData.vendor_code) {
        throw new Error("No meaningful PO data found - response appears to be empty");
      }
      
      console.log(`✅ PODataExtractionAgent: Successfully parsed data for ${fileName}:`, parsedData);
      
      return {
        success: true,
        data: parsedData
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
