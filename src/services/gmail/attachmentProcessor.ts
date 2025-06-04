
import { GmailApiService } from './gmailApiService';
import { AttachmentMetadataExtractor } from './attachmentMetadataExtractor';
import { EmailContextAnalyzer } from './emailContextAnalyzer';
import { FileConverter } from './fileConverter';

export interface EmailAttachment {
  file: File;
  filename: string;
  mimeType: string;
  size: number;
}

export class GmailAttachmentProcessor {
  private gmailApi: GmailApiService;
  private metadataExtractor: AttachmentMetadataExtractor;
  private contextAnalyzer: EmailContextAnalyzer;

  constructor(accessToken: string) {
    this.gmailApi = new GmailApiService(accessToken);
    this.metadataExtractor = new AttachmentMetadataExtractor();
    this.contextAnalyzer = new EmailContextAnalyzer(this.gmailApi);
  }

  async extractEmailAttachments(messageId: string): Promise<EmailAttachment[]> {
    try {
      console.log(`Extracting attachments from email ${messageId}`);
      
      // Get full message details
      const messageResponse = await this.gmailApi.getMessageDetails(messageId);
      if (!messageResponse.success) {
        console.error('Failed to get message details');
        return [];
      }

      const message = messageResponse.data;
      
      // Extract attachment metadata
      const attachmentMetadata = this.metadataExtractor.extractFromMessageParts(
        message.payload?.parts || []
      );

      if (attachmentMetadata.length === 0) {
        console.log('No supported attachments found');
        return [];
      }

      console.log(`Found ${attachmentMetadata.length} attachments to download`);

      // Download each attachment
      const attachments: EmailAttachment[] = [];
      for (const metadata of attachmentMetadata) {
        try {
          console.log(`Downloading: ${metadata.filename}`);
          
          const attachmentResponse = await this.gmailApi.downloadAttachment(
            messageId, 
            metadata.attachmentId
          );
          
          if (!attachmentResponse.success) {
            console.error(`Failed to download ${metadata.filename}:`, attachmentResponse.error);
            continue;
          }

          // Convert to File object
          const file = FileConverter.createFileFromAttachment(
            attachmentResponse.data.data,
            metadata.filename,
            metadata.mimeType
          );

          attachments.push({
            file,
            filename: metadata.filename,
            mimeType: metadata.mimeType,
            size: metadata.size
          });

          console.log(`✅ Successfully downloaded: ${metadata.filename}`);
        } catch (error) {
          console.error(`Failed to process attachment ${metadata.filename}:`, error);
        }
      }

      console.log(`Successfully downloaded ${attachments.length} out of ${attachmentMetadata.length} attachments`);
      return attachments;

    } catch (error) {
      console.error('Error extracting email attachments:', error);
      return [];
    }
  }

  async analyzeEmailForInvoiceContext(messageId: string): Promise<any> {
    try {
      // First get message to count real attachments
      const messageResponse = await this.gmailApi.getMessageDetails(messageId);
      if (!messageResponse.success) {
        return this.contextAnalyzer.analyzeForInvoiceContext(messageId, 0);
      }

      const attachmentCount = this.metadataExtractor.extractFromMessageParts(
        messageResponse.data.payload?.parts || []
      ).length;

      return this.contextAnalyzer.analyzeForInvoiceContext(messageId, attachmentCount);
    } catch (error) {
      console.error('Error analyzing email for invoice context:', error);
      return this.contextAnalyzer.analyzeForInvoiceContext(messageId, 0);
    }
  }
}
