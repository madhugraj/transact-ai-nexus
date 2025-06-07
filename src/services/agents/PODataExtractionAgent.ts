
import { fileToBase64 } from '@/services/api/gemini/fileUtils';

export class PODataExtractionAgent {
  async process(file: File): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log(`📊 PODataExtractionAgent: Processing file ${file.name} with Gemini AI`);
      
      // Check if it's a PDF file
      if (file.type === 'application/pdf') {
        console.log(`📄 PODataExtractionAgent: Processing PDF file ${file.name}`);
        
        // First, try to convert PDF to base64 and send directly to Gemini
        try {
          const base64Data = await fileToBase64(file);
          console.log(`📊 PODataExtractionAgent: PDF converted to base64, size: ${base64Data.length} chars`);
          
          // Try direct PDF processing with Gemini first
          const extractedData = await this.extractPODataWithGemini(base64Data, file.type, file.name);
          
          if (extractedData.success) {
            console.log(`✅ PODataExtractionAgent: Direct PDF processing successful for ${file.name}`);
            return extractedData;
          }
          
          console.log(`⚠️ PODataExtractionAgent: Direct PDF processing failed, trying image conversion for ${file.name}`);
        } catch (error) {
          console.error(`❌ PODataExtractionAgent: Direct PDF processing error for ${file.name}:`, error);
        }
        
        // Fallback: Try PDF to image conversion
        const imageData = await this.convertPdfToImage(file);
        
        if (!imageData) {
          console.error(`❌ PODataExtractionAgent: All PDF processing methods failed for ${file.name}`);
          return { 
            success: false, 
            error: 'Unable to process PDF file. The file may be corrupted or password-protected.' 
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
You are an expert document analysis AI. Analyze this document and extract Purchase Order information.

CRITICAL INSTRUCTIONS:
1. This document may be a Purchase Order - examine it very carefully
2. Extract ANY relevant business information you can find
3. For PO number: Look for ANY number that could identify this document (PO#, Order#, Doc#, Reference#, etc.)
4. Be flexible with data extraction - some fields may be missing or unclear
5. Return meaningful data even if the document format is unusual

EXTRACTION REQUIREMENTS:
- PO Number: ANY identifying number (can be alphanumeric)
- Dates: Convert to YYYY-MM-DD format when possible
- Vendor: Any company/supplier information
- Line Items: Extract tabular data with items, quantities, prices
- Addresses: Extract any address information found
- Terms: Payment terms, delivery terms, conditions

REQUIRED JSON FORMAT:
{
  "po_number": "any identifying number found",
  "po_date": "YYYY-MM-DD or null",
  "vendor_code": "vendor identifier or null", 
  "gstn": "tax number if found or null",
  "project": "project name/code or null",
  "bill_to_address": "billing address or null",
  "ship_to": "shipping address or null", 
  "del_start_date": "delivery start date or null",
  "del_end_date": "delivery end date or null",
  "terms_conditions": "payment/delivery terms or null",
  "description": [
    {
      "item": "item description",
      "quantity": 1,
      "unit_price": 0,
      "total": 0
    }
  ]
}

IMPORTANT NOTES:
- If you cannot find a specific PO number, extract ANY document reference number
- Extract company names, addresses, and contact information
- Look for ANY structured data or tables
- Don't return all null values unless the document is completely unreadable
- Be generous in your interpretation of what constitutes relevant data

Return ONLY valid JSON with the extracted data.
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
      
      // Check if we got any meaningful data
      const hasData = parsedData.po_number || 
                     parsedData.vendor_code || 
                     parsedData.bill_to_address ||
                     parsedData.terms_conditions ||
                     (parsedData.description && Array.isArray(parsedData.description) && parsedData.description.length > 0);
      
      if (!hasData) {
        console.warn(`⚠️ PODataExtractionAgent: Limited data extracted for ${fileName}`);
        
        // Try to extract at least something meaningful
        if (responseText.length > 50) {
          // If we have a substantial response, create a basic structure
          parsedData = {
            po_number: `DOC_${Date.now()}`, // Generate a fallback document ID
            po_date: null,
            vendor_code: null,
            gstn: null,
            project: null,
            bill_to_address: null,
            ship_to: null,
            del_start_date: null,
            del_end_date: null,
            terms_conditions: `Extracted text: ${responseText.substring(0, 200)}...`,
            description: []
          };
        } else {
          return {
            success: false,
            error: 'Could not extract meaningful data from document'
          };
        }
      }
      
      console.log(`✅ PODataExtractionAgent: Successfully parsed data for ${fileName}:`, parsedData);
      
      return {
        success: true,
        data: {
          ...parsedData,
          extraction_confidence: hasData ? 'high' : 'low'
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
