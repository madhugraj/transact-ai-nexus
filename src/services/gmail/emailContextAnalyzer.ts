
import { GmailApiService } from './gmailApiService';

export class EmailContextAnalyzer {
  private gmailApi: GmailApiService;

  constructor(gmailApi: GmailApiService) {
    this.gmailApi = gmailApi;
  }

  async analyzeForInvoiceContext(messageId: string, attachmentCount: number): Promise<any> {
    try {
      console.log(`📧 Analyzing email ${messageId} for invoice context...`);
      
      const messageResponse = await this.gmailApi.getMessageDetails(messageId);
      if (!messageResponse.success) {
        console.error('Failed to get message details for context analysis');
        return {
          isLikelyInvoice: false,
          context: {
            attachmentCount: 0,
            hasInvoiceKeywords: false,
            hasFinancialKeywords: false,
            hasBusinessKeywords: false,
            subject: '',
            from: '',
            analysis: 'Failed to analyze email'
          }
        };
      }

      const message = messageResponse.data;
      const headers = message.payload?.headers || [];
      
      // Extract key email data
      const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
      const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
      const to = headers.find(h => h.name.toLowerCase() === 'to')?.value || '';
      
      // Get email body for content analysis
      const bodyText = this.extractEmailBodyText(message.payload);
      
      console.log(`📧 Email analysis - Subject: "${subject}", From: "${from}"`);
      console.log(`📧 Body preview: "${bodyText.substring(0, 200)}..."`);
      
      // Enhanced keyword detection for invoices
      const invoiceKeywords = [
        'invoice', 'bill', 'receipt', 'payment', 'charge', 'statement',
        'due', 'amount', 'total', 'subtotal', 'tax', 'vat', 'gst',
        'purchase order', 'po#', 'order number', 'transaction',
        'remittance', 'payable', 'outstanding', 'balance',
        'factura', 'rechnung', 'fattura', 'note de frais'
      ];
      
      const financialKeywords = [
        'cost', 'price', 'fee', 'expense', 'billing', 'accounting',
        'financial', 'money', 'payment due', 'overdue', 'credit',
        'debit', 'refund', 'deposit', 'subscription', 'renewal'
      ];
      
      const businessKeywords = [
        'vendor', 'supplier', 'customer', 'client', 'service',
        'delivery', 'order', 'purchase', 'sale', 'contract',
        'agreement', 'terms', 'conditions', 'net 30', 'net 60'
      ];

      // Combine subject, from, to, and body for comprehensive analysis
      const fullText = `${subject} ${from} ${to} ${bodyText}`.toLowerCase();
      
      const hasInvoiceKeywords = invoiceKeywords.some(keyword => 
        fullText.includes(keyword.toLowerCase())
      );
      
      const hasFinancialKeywords = financialKeywords.some(keyword => 
        fullText.includes(keyword.toLowerCase())
      );
      
      const hasBusinessKeywords = businessKeywords.some(keyword => 
        fullText.includes(keyword.toLowerCase())
      );

      // More permissive logic - consider it likely invoice if:
      // 1. Has attachments AND any relevant keywords, OR
      // 2. Strong invoice indicators in text regardless of attachments, OR
      // 3. Financial keywords with business context
      const isLikelyInvoice = 
        (attachmentCount > 0 && (hasInvoiceKeywords || hasFinancialKeywords || hasBusinessKeywords)) ||
        hasInvoiceKeywords ||
        (hasFinancialKeywords && hasBusinessKeywords);

      const context = {
        attachmentCount,
        hasInvoiceKeywords,
        hasFinancialKeywords,
        hasBusinessKeywords,
        subject,
        from,
        bodyPreview: bodyText.substring(0, 300),
        analysis: `Keywords found - Invoice: ${hasInvoiceKeywords}, Financial: ${hasFinancialKeywords}, Business: ${hasBusinessKeywords}`
      };

      console.log(`📧 Context analysis complete:`, {
        isLikelyInvoice,
        attachmentCount,
        hasInvoiceKeywords,
        hasFinancialKeywords,
        hasBusinessKeywords
      });

      return {
        isLikelyInvoice,
        context
      };

    } catch (error) {
      console.error('Error analyzing email context:', error);
      return {
        isLikelyInvoice: false,
        context: {
          attachmentCount: 0,
          hasInvoiceKeywords: false,
          hasFinancialKeywords: false,
          hasBusinessKeywords: false,
          subject: '',
          from: '',
          analysis: `Error during analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  }

  private extractEmailBodyText(payload: any): string {
    if (!payload) return '';

    try {
      // Handle multipart emails
      if (payload.parts && payload.parts.length > 0) {
        let bodyText = '';
        for (const part of payload.parts) {
          bodyText += this.extractEmailBodyText(part);
        }
        return bodyText;
      }

      // Handle single part emails
      if (payload.body && payload.body.data) {
        const mimeType = payload.mimeType || '';
        if (mimeType.includes('text/plain') || mimeType.includes('text/html')) {
          try {
            const decodedData = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            return decodedData;
          } catch (decodeError) {
            console.warn('Failed to decode email body:', decodeError);
            return '';
          }
        }
      }

      return '';
    } catch (error) {
      console.error('Error extracting email body text:', error);
      return '';
    }
  }
}
