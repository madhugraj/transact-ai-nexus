
import { Agent, AgentResult } from './types';
import { processImageWithGemini } from '@/services/api/geminiService';

export class InvoiceDetectionAgent implements Agent {
  id = 'invoice-detection';
  name = 'Invoice Detection Agent';
  description = 'Validates if a document is an invoice using Gemini Vision AI';

  async process(file: File): Promise<AgentResult> {
    console.log(`🔍 ${this.name}: Starting invoice detection for ${file.name}`);
    
    try {
      // Convert file to base64 for Gemini processing
      const base64Image = await this.fileToBase64(file);
      
      const prompt = `
You are an expert document classifier. Analyze this document and determine if it is an INVOICE.

An invoice typically contains:
- Invoice number
- Invoice date
- Seller/supplier information
- Buyer information
- Line items with descriptions, quantities, and prices
- Total amount due
- Payment terms

Respond with ONLY a JSON object in this exact format:
{
  "is_invoice": true/false,
  "confidence": 0.0-1.0,
  "reason": "Brief explanation of why this is or isn't an invoice",
  "document_type": "invoice" or "other_document_type"
}
`;

      const response = await processImageWithGemini(prompt, base64Image, file.type);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to process document');
      }

      const result = this.parseGeminiResponse(response.data || '');
      
      console.log(`✅ ${this.name}: Detection complete - ${result.is_invoice ? 'INVOICE' : 'NOT INVOICE'}`);
      
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
      // Try to extract JSON from code blocks
      const codeBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i;
      const codeBlockMatch = responseText.match(codeBlockRegex);
      
      if (codeBlockMatch) {
        try {
          return JSON.parse(codeBlockMatch[1].trim());
        } catch (error) {
          console.error('Failed to parse JSON from code block:', error);
        }
      }
      
      // Fallback
      return {
        is_invoice: false,
        confidence: 0.0,
        reason: 'Failed to parse response',
        document_type: 'unknown'
      };
    }
  }
}
