
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
        throw new Error(response.error || 'Failed to process document');
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
          fileName: file.name
        }
      };
      
    } catch (error) {
      console.error(`❌ ${this.name}: Error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        agent: this.id
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
