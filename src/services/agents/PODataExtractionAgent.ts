
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
      const viewport = page.getViewport({ scale: 3.0 }); // Higher scale for better quality
      
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

CRITICAL INSTRUCTIONS:
1. This is a Purchase Order document - examine it very carefully
2. Look for ANY text, numbers, or structured data in the image
3. Extract EVERY piece of information you can find, even if fields are unclear
4. For PO number: Look for ANY numbers that could be a PO number - check headers, footers, anywhere
5. Convert dates to YYYY-MM-DD format when possible
6. For line items: Extract ANY tabular data you see
7. If text is unclear, make your best interpretation
8. NEVER return all null values unless the image is completely blank

ENHANCED EXTRACTION PATTERNS:
- PO Number patterns: "PO", "P.O.", "Purchase Order", "Order No", "Doc No", ANY prominent number
- Look for company names, addresses, contact information
- Find ANY tabular data with items, quantities, prices
- Extract dates from anywhere in the document
- Look for terms like "Net 30", "Payment Terms", etc.

REQUIRED JSON FORMAT - Return this structure with extracted data:
{
  "po_number": "extract ANY number that could be PO number - be liberal in interpretation",
  "po_date": "date in YYYY-MM-DD format if found, otherwise null",
  "vendor_code": "any vendor/supplier identifier or null",
  "gstn": "GST/tax number if found or null",
  "project": "project name/code if found or null",
  "bill_to_address": "full billing/company address or null",
  "ship_to": "shipping address if different or null",
  "del_start_date": "delivery start date if found or null",
  "del_end_date": "delivery end date if found or null",
  "terms_conditions": "payment terms or any conditions found or null",
  "description": [
    {
      "item": "item/service description",
      "quantity": number_or_1_if_unclear,
      "unit_price": number_or_0_if_unclear,
      "total": number_or_0_if_unclear
    }
  ]
}

IMPORTANT: 
- If you see ANY text or data, extract it
- Don't return all nulls unless image is truly blank
- Be generous in your interpretation of what could be relevant data
- Extract company names, contact info, any structured data you see

Return ONLY valid JSON with extracted data.
`;

      console.log(`🤖 PODataExtractionAgent: Sending enhanced request to Gemini for ${fileName}`);
      
      // Use Gemini API key from environment or localStorage
      const apiKey = typeof window !== 'undefined' 
        ? localStorage.getItem('GEMINI_API_KEY') || 'AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk'
        : 'AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk';

      // Call the Gemini API with enhanced parameters
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
                      data: base64Data.replace(/^data:image\/\w+;base64,/, '')
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2, // Slightly higher for more flexible interpretation
              maxOutputTokens: 4096,
              topP: 0.8,
              topK: 40
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
      
      // Enhanced validation - check if we got meaningful data
      const hasData = parsedData.po_number || 
                     parsedData.vendor_code || 
                     parsedData.bill_to_address ||
                     parsedData.terms_conditions ||
                     (parsedData.description && parsedData.description.length > 0);
      
      if (!hasData) {
        console.warn(`⚠️ PODataExtractionAgent: Gemini returned mostly empty data for ${fileName}. Response:`, parsedData);
        // Still return success but with a warning
        return {
          success: true,
          data: {
            ...parsedData,
            extraction_confidence: 'low',
            extraction_note: 'Limited data extracted from document'
          }
        };
      }
      
      console.log(`✅ PODataExtractionAgent: Successfully parsed data for ${fileName}:`, parsedData);
      
      return {
        success: true,
        data: {
          ...parsedData,
          extraction_confidence: 'high'
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
