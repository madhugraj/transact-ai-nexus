
import { GmailApiService } from './gmailApiService';

export interface EmailContext {
  isLikelyInvoice: boolean;
  context: {
    subject: string;
    from: string;
    hasInvoiceKeywords: boolean;
    attachmentCount: number;
    invoiceKeywords: string[];
  };
}

export class EmailContextAnalyzer {
  private invoiceKeywords = [
    'invoice', 'bill', 'receipt', 'payment', 'due', 'amount',
    'po number', 'purchase order', 'gst', 'tax', 'total',
    'payable', 'remittance', 'statement'
  ];

  constructor(private gmailApi: GmailApiService) {}

  async analyzeForInvoiceContext(messageId: string, attachmentCount: number): Promise<EmailContext> {
    try {
      console.log(`Analyzing email context for message: ${messageId}`);
      
      const response = await this.gmailApi.getMessageDetails(messageId);
      
      if (!response.success) {
        console.error('Failed to get message details for context analysis');
        return this.getDefaultContext();
      }

      const message = response.data;
      const headers = message.payload?.headers || [];
      
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      
      const foundKeywords = this.invoiceKeywords.filter(keyword => 
        subject.toLowerCase().includes(keyword) || 
        from.toLowerCase().includes(keyword)
      );

      const hasInvoiceKeywords = foundKeywords.length > 0;
      
      // An email is likely an invoice if it has attachments
      // (being more permissive as user mentioned emails contain invoices)
      const isLikelyInvoice = attachmentCount > 0;

      console.log(`Email analysis: ${isLikelyInvoice ? 'LIKELY INVOICE' : 'NOT INVOICE'}, keywords: ${foundKeywords.join(', ')}`);

      return {
        isLikelyInvoice,
        context: {
          subject,
          from,
          hasInvoiceKeywords,
          attachmentCount,
          invoiceKeywords: foundKeywords
        }
      };
    } catch (error) {
      console.error('Error analyzing email context:', error);
      return this.getDefaultContext();
    }
  }

  private getDefaultContext(): EmailContext {
    return {
      isLikelyInvoice: false,
      context: {
        subject: '',
        from: '',
        hasInvoiceKeywords: false,
        attachmentCount: 0,
        invoiceKeywords: []
      }
    };
  }
}
