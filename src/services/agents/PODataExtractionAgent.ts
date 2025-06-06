
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
          throw new Error('Failed to convert PDF to image');
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
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
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
  
  private async extractPODataWithGemini(base64Image: string, mimeType: string, fileName: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const prompt = `
You are an OCR assistant specializing in extracting Purchase Order (PO) data from documents. Read this document image and extract ALL relevant PO information.

Extract the following fields if present:
- po_number: The purchase order number (extract as number)
- po_date: The PO date (format as YYYY-MM-DD)
- vendor_code: Vendor/supplier code or ID
- gstn: GST number if available
- project: Project name or code
- bill_to_address: Billing address
- ship_to: Shipping address
- del_start_date: Delivery start date (format as YYYY-MM-DD)
- del_end_date: Delivery end date (format as YYYY-MM-DD)
- terms_conditions: Terms and conditions text
- description: Array of line items with item, quantity, unit_price, total for each item

FORMAT YOUR RESPONSE AS JSON:
{
  "po_number": 12345,
  "po_date": "2024-01-15",
  "vendor_code": "V001",
  "gstn": "22ABCDE1234F1Z5",
  "project": "Project Alpha",
  "bill_to_address": "123 Main St, City",
  "ship_to": "456 Oak Ave, Town",
  "del_start_date": "2024-02-01",
  "del_end_date": "2024-02-28",
  "terms_conditions": "Payment within 30 days",
  "description": [
    {
      "item": "Product A",
      "quantity": 10,
      "unit_price": 100.00,
      "total": 1000.00
    }
  ]
}

Only return valid JSON with no additional text, explanations or markdown. If a field is not found, use null for that field.
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
                      data: base64Image
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
      
      // Extract JSON from response text
      const jsonMatch = responseText.match(/\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in the Gemini response");
      }
      
      // Parse the JSON content
      const parsedData = JSON.parse(jsonMatch[0]);
      
      // Validate that we have at least a PO number
      if (!parsedData.po_number) {
        throw new Error("No PO number found in the extracted data");
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
