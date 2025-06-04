
export interface AttachmentMetadata {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

export class AttachmentMetadataExtractor {
  private supportedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/tiff',
    'image/bmp'
  ];

  extractFromMessageParts(parts: any[]): AttachmentMetadata[] {
    const attachments: AttachmentMetadata[] = [];
    console.log('Extracting attachment metadata from message parts');

    this.processParts(parts, attachments);
    
    console.log(`Found ${attachments.length} supported attachments`);
    return attachments;
  }

  private processParts(parts: any[], attachments: AttachmentMetadata[]) {
    for (const part of parts) {
      // Check if this part is an attachment
      if (this.isValidAttachment(part)) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body.size || 0,
          attachmentId: part.body.attachmentId
        });
        console.log(`Found attachment: ${part.filename} (${part.mimeType})`);
      }

      // Recursively process nested parts
      if (part.parts && Array.isArray(part.parts)) {
        this.processParts(part.parts, attachments);
      }
    }
  }

  private isValidAttachment(part: any): boolean {
    return !!(
      part.filename && 
      part.filename.length > 0 && 
      part.body?.attachmentId &&
      part.mimeType &&
      this.supportedTypes.includes(part.mimeType.toLowerCase())
    );
  }
}
