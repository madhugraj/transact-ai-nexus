
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
    'payable', 'remittance', 'statement', 'quote', 'estimate'
  ];

  constructor(private gmailApi: GmailApiService) {}

  async analyzeForInvoiceContext(messageId: string, attachmentCount: number): Promise<EmailContext> {
    try {
      console.log(`Analyzing email context for message: ${messageId}, attachments: ${attachmentCount}`);
      
      const response = await this.gmailApi.getMessageDetails(messageId);
      
      if (!response.success) {
        console.error('Failed to get message details for context analysis');
        return this.getDefaultContext(attachmentCount);
      }

      const message = response.data;
      const headers = message.payload?.headers || [];
      
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      
      // Also check email body for invoice keywords
      let bodyText = '';
      if (message.payload?.body?.data) {
        try {
          bodyText = atob(message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        } catch (e) {
          console.log('Could not decode email body');
        }
      }
      
      const foundKeywords = this.invoiceKeywords.filter(keyword => 
        subject.toLowerCase().includes(keyword) || 
        from.toLowerCase().includes(keyword) ||
        bodyText.toLowerCase().includes(keyword)
      );

      const hasInvoiceKeywords = foundKeywords.length > 0;
      
      // An email is likely an invoice if it has attachments OR contains invoice keywords
      // Being more permissive since user mentioned emails contain invoices
      const isLikelyInvoice = attachmentCount > 0 || hasInvoiceKeywords;

      console.log(`Email analysis result:`);
      console.log(`- Subject: "${subject}"`);
      console.log(`- From: "${from}"`);
      console.log(`- Attachments: ${attachmentCount}`);
      console.log(`- Keywords found: [${foundKeywords.join(', ')}]`);
      console.log(`- Final decision: ${isLikelyInvoice ? 'LIKELY INVOICE' : 'NOT INVOICE'}`);

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
      return this.getDefaultContext(attachmentCount);
    }
  }

  private getDefaultContext(attachmentCount: number = 0): EmailContext {
    // If we have attachments, assume it might be invoice-related as fallback
    const isLikelyInvoice = attachmentCount > 0;
    
    return {
      isLikelyInvoice,
      context: {
        subject: '',
        from: '',
        hasInvoiceKeywords: false,
        attachmentCount,
        invoiceKeywords: []
      }
    };
  }
}
