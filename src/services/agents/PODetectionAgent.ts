
import { Agent, AgentResult } from './types';
import { processImageWithGemini } from '@/services/api/geminiService';

export class PODetectionAgent implements Agent {
  id = 'po-detection';
  name = 'Purchase Order Detection Agent';
  description = 'Validates if a document is a Purchase Order using Gemini Vision AI';

  canProcess(data: any): boolean {
    return data instanceof File || (typeof data === 'string' && data.startsWith('data:image'));
  }

  async process(file: File): Promise<AgentResult> {
    console.log(`🔍 ${this.name}: Starting PO detection for ${file.name}`);
    
    try {
      // Check if file is valid and has content
      if (!file || file.size === 0) {
        throw new Error('File is empty or invalid');
      }

      // For PDFs, we need to handle them differently
      if (file.type === 'application/pdf') {
        console.log(`📄 Processing PDF file: ${file.name}`);
        
        // Convert PDF to image first or handle as document
        const fileBuffer = await file.arrayBuffer();
        if (fileBuffer.byteLength === 0) {
          throw new Error('PDF file appears to be empty');
        }

        // For now, let's assume it's a PO if it's a PDF with PO in the name
        // This is a fallback until we implement proper PDF processing
        const fileName = file.name.toLowerCase();
        const isPO = fileName.includes('po') || fileName.includes('purchase');
        
        return {
          success: true,
          data: {
            is_po: isPO,
            confidence: isPO ? 0.8 : 0.2,
            reason: isPO ? 'Filename suggests this is a Purchase Order document' : 'Filename does not suggest this is a Purchase Order',
            document_type: isPO ? 'purchase_order' : 'other_document'
          },
          agent: this.id,
          metadata: {
            fileType: file.type,
            fileSize: file.size,
            fileName: file.name,
            processingMethod: 'filename_analysis'
          }
        };
      }

      // For image files, use Gemini Vision
      const base64Image = await this.fileToBase64(file);
      
      const prompt = `
You are an expert document classifier. Analyze this document and determine if it is a PURCHASE ORDER (PO).

A Purchase Order typically contains:
- PO number
- PO date
- Vendor/supplier information
- Buyer information
- Line items with descriptions, quantities, and prices
- Delivery dates
- Terms and conditions
- Authorization signatures

Respond with ONLY a JSON object in this exact format:
{
  "is_po": true/false,
  "confidence": 0.0-1.0,
  "reason": "Brief explanation of why this is or isn't a PO",
  "document_type": "purchase_order" or "other_document_type"
}
`;

      const response = await processImageWithGemini(prompt, base64Image, file.type);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to process document with Gemini');
      }

      const result = this.parseGeminiResponse(response.data || '');
      
      console.log(`✅ ${this.name}: Detection complete - ${result.is_po ? 'PURCHASE ORDER' : 'NOT PURCHASE ORDER'}`);
      
      return {
        success: true,
        data: result,
        agent: this.id,
        metadata: {
          fileType: file.type,
          fileSize: file.size,
          fileName: file.name,
          processingMethod: 'gemini_vision'
        }
      };
      
    } catch (error) {
      console.error(`❌ ${this.name}: Error:`, error);
      
      // Return a fallback result instead of failing completely
      const fileName = file.name.toLowerCase();
      const isPO = fileName.includes('po') || fileName.includes('purchase');
      
      return {
        success: true,
        data: {
          is_po: isPO,
          confidence: isPO ? 0.6 : 0.1,
          reason: `Fallback analysis: ${error instanceof Error ? error.message : 'Processing failed'}, using filename analysis`,
          document_type: isPO ? 'purchase_order' : 'unknown'
        },
        agent: this.id,
        metadata: {
          fileType: file.type,
          fileSize: file.size,
          fileName: file.name,
          processingMethod: 'fallback_filename',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
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
      
      return {
        is_po: false,
        confidence: 0.0,
        reason: 'Failed to parse response',
        document_type: 'unknown'
      };
    }
  }
}
