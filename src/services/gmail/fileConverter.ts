
export class FileConverter {
  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    try {
      console.log('Converting base64 to ArrayBuffer');
      
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
      throw new Error(`Failed to decode base64 data: ${error.message}`);
    }
  }

  static createFileFromAttachment(
    attachmentData: string, 
    filename: string, 
    mimeType: string
  ): File {
    const binaryData = this.base64ToArrayBuffer(attachmentData);
    const blob = new Blob([binaryData], { type: mimeType });
    return new File([blob], filename, { type: mimeType });
  }
}
