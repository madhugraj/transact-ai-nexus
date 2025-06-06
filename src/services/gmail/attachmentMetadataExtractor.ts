
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

  // Common patterns for unwanted images (logos, signatures, etc.)
  private unwantedImagePatterns = [
    /logo/i,
    /signature/i,
    /banner/i,
    /header/i,
    /footer/i,
    /company.*logo/i,
    /brand/i,
    /masthead/i,
    /letterhead/i,
    /stamp/i,
    /seal/i,
    /watermark/i,
    /icon/i,
    /avatar/i,
    /profile/i,
    /social/i,
    /facebook/i,
    /twitter/i,
    /linkedin/i,
    /instagram/i,
    /email.*signature/i,
    /confidential/i,
    /disclaimer/i
  ];

  extractFromMessageParts(parts: any[]): AttachmentMetadata[] {
    const attachments: AttachmentMetadata[] = [];
    console.log('Extracting attachment metadata from message parts');

    this.processParts(parts, attachments);
    
    console.log(`Found ${attachments.length} supported attachments after filtering`);
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
    if (!part.filename || 
        part.filename.length === 0 || 
        !part.body?.attachmentId ||
        !part.mimeType ||
        !this.supportedTypes.includes(part.mimeType.toLowerCase())) {
      return false;
    }

    // Filter out unwanted images (logos, signatures, etc.)
    if (part.mimeType.toLowerCase().startsWith('image/')) {
      const filename = part.filename.toLowerCase();
      
      // Check if filename matches unwanted patterns
      const isUnwanted = this.unwantedImagePatterns.some(pattern => pattern.test(filename));
      
      if (isUnwanted) {
        console.log(`🚫 Filtering out unwanted image: ${part.filename}`);
        return false;
      }

      // Filter out very small images (likely logos/icons) - less than 10KB
      const fileSize = part.body.size || 0;
      if (fileSize < 10240) { // 10KB
        console.log(`🚫 Filtering out small image (${fileSize} bytes): ${part.filename}`);
        return false;
      }
    }

    return true;
  }
}
