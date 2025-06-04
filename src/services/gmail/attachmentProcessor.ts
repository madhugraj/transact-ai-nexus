
import { supabase } from '@/integrations/supabase/client';

interface GmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
  data?: string;
}

interface EmailAttachment {
  file: File;
  filename: string;
  mimeType: string;
  size: number;
}

export class GmailAttachmentProcessor {
  constructor(private accessToken: string) {}

  async extractEmailAttachments(messageId: string): Promise<EmailAttachment[]> {
    try {
      console.log(`Extracting attachments from email ${messageId}`);
      
      // Get full message details
      const { data, error } = await supabase.functions.invoke('gmail', {
        body: {
          accessToken: this.accessToken,
          action: 'get',
          messageId
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      const message = data.data;
      const attachments: EmailAttachment[] = [];

      // Extract attachment metadata from message parts
      const attachmentPromises = this.extractAttachmentMetadata(message.payload?.parts || [])
        .map(async (attachment) => {
          try {
            console.log(`Downloading attachment: ${attachment.filename}`);
            
            // Download actual attachment data
            const attachmentData = await this.downloadAttachment(messageId, attachment.attachmentId);
            
            // Convert base64 to blob and create File object
            const binaryData = this.base64ToArrayBuffer(attachmentData);
            const blob = new Blob([binaryData], { type: attachment.mimeType });
            const file = new File([blob], attachment.filename, { type: attachment.mimeType });

            return {
              file,
              filename: attachment.filename,
              mimeType: attachment.mimeType,
              size: attachment.size
            };
          } catch (error) {
            console.error(`Failed to download attachment ${attachment.filename}:`, error);
            return null;
          }
        });

      const downloadedAttachments = await Promise.all(attachmentPromises);
      return downloadedAttachments.filter(attachment => attachment !== null) as EmailAttachment[];

    } catch (error) {
      console.error('Error extracting email attachments:', error);
      return [];
    }
  }

  private extractAttachmentMetadata(parts: any[]): GmailAttachment[] {
    const attachments: GmailAttachment[] = [];

    const processPart = (part: any) => {
      if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
        // Only process PDF and image files that are likely to be invoices
        const supportedTypes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg', 
          'image/png',
          'image/tiff',
          'image/bmp'
        ];

        if (supportedTypes.includes(part.mimeType?.toLowerCase())) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size || 0,
            attachmentId: part.body.attachmentId
          });
        }
      }

      // Recursively process nested parts
      if (part.parts) {
        part.parts.forEach(processPart);
      }
    };

    parts.forEach(processPart);
    return attachments;
  }

  private async downloadAttachment(messageId: string, attachmentId: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke('gmail', {
      body: {
        accessToken: this.accessToken,
        action: 'attachment',
        messageId,
        attachmentId
      }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    return data.data.data; // Base64 encoded attachment data
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    try {
      // Handle URL-safe base64 and fix padding if needed
      let cleanBase64 = base64.replace(/\s/g, '');
      
      // Convert URL-safe base64 to regular base64
      cleanBase64 = cleanBase64.replace(/-/g, '+').replace(/_/g, '/');
      
      // Add padding if needed
      while (cleanBase64.length % 4) {
        cleanBase64 += '=';
      }
      
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      return bytes.buffer;
    } catch (error) {
      console.error('Base64 decode error:', error);
      console.error('Base64 string length:', base64.length);
      console.error('Base64 sample:', base64.substring(0, 100));
      throw new Error(`Failed to decode base64 data: ${error.message}`);
    }
  }

  async analyzeEmailForInvoiceContext(messageId: string): Promise<{
    isLikelyInvoice: boolean;
    context: {
      subject: string;
      from: string;
      hasInvoiceKeywords: boolean;
      attachmentCount: number;
      invoiceKeywords: string[];
    }
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('gmail', {
        body: {
          accessToken: this.accessToken,
          action: 'get',
          messageId
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      const message = data.data;
      const headers = message.payload?.headers || [];
      
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      
      // Invoice-related keywords to look for
      const invoiceKeywords = [
        'invoice', 'bill', 'receipt', 'payment', 'due', 'amount',
        'po number', 'purchase order', 'gst', 'tax', 'total',
        'payable', 'remittance', 'statement'
      ];

      const foundKeywords = invoiceKeywords.filter(keyword => 
        subject.toLowerCase().includes(keyword) || 
        from.toLowerCase().includes(keyword)
      );

      const hasInvoiceKeywords = foundKeywords.length > 0;
      const attachmentCount = this.extractAttachmentMetadata(message.payload?.parts || []).length;

      // Since you mentioned all selected emails have invoice attachments, 
      // let's be more permissive and assume emails with attachments are likely invoices
      return {
        isLikelyInvoice: attachmentCount > 0, // More permissive logic
        context: {
          subject,
          from,
          hasInvoiceKeywords,
          attachmentCount,
          invoiceKeywords: foundKeywords
        }
      };
    } catch (error) {
      console.error('Error analyzing email for invoice context:', error);
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
}
