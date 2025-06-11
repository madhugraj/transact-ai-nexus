
export class FileConverter {
  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    try {
      console.log('🔄 Converting base64 to ArrayBuffer, length:', base64.length);
      
      // Handle URL-safe base64 and fix padding if needed
      let cleanBase64 = base64.replace(/\s/g, '');
      
      // Convert URL-safe base64 to regular base64
      cleanBase64 = cleanBase64.replace(/-/g, '+').replace(/_/g, '/');
      
      // Add padding if needed
      while (cleanBase64.length % 4) {
        cleanBase64 += '=';
      }
      
      console.log('🔄 Cleaned base64 length:', cleanBase64.length);
      
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      console.log('✅ ArrayBuffer created, byte length:', bytes.buffer.byteLength);
      return bytes.buffer;
    } catch (error) {
      console.error('❌ Base64 decode error:', error);
      throw new Error(`Failed to decode base64 data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static createFileFromAttachment(
    attachmentData: string, 
    filename: string, 
    mimeType: string
  ): File {
    console.log('🔄 Creating file from attachment:', { filename, mimeType, dataLength: attachmentData.length });
    
    const arrayBuffer = this.base64ToArrayBuffer(attachmentData);
    const blob = new Blob([arrayBuffer], { type: mimeType });
    const file = new File([blob], filename, { 
      type: mimeType,
      lastModified: Date.now()
    });
    
    console.log('✅ File created successfully:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });
    
    return file;
  }

  static createFileFromCloudStorage(
    data: string | ArrayBuffer | Uint8Array,
    filename: string,
    mimeType: string
  ): File {
    try {
      console.log('🔄 Creating file from cloud storage data:', { filename, mimeType, dataType: typeof data });
      
      let fileData: ArrayBuffer;
      
      // Check if data is already a Blob or ArrayBuffer
      if (data instanceof ArrayBuffer) {
        console.log('📦 Data is ArrayBuffer');
        fileData = data;
      } else if (data instanceof Uint8Array) {
        console.log('📦 Data is Uint8Array');
        fileData = data.buffer;
      } else if (typeof data === 'string') {
        console.log('📦 Data is string, converting from base64');
        // Remove data URL prefix if present
        const cleanData = data.replace(/^data:[^;]+;base64,/, '');
        fileData = this.base64ToArrayBuffer(cleanData);
      } else {
        console.log('📦 Data is unknown type, treating as binary');
        // Convert to ArrayBuffer if it's raw binary data
        const uint8Array = new Uint8Array(data as any);
        fileData = uint8Array.buffer;
      }
      
      const blob = new Blob([fileData], { type: mimeType });
      const file = new File([blob], filename, { 
        type: mimeType,
        lastModified: Date.now()
      });
      
      console.log('✅ File created from cloud storage:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      
      return file;
    } catch (error) {
      console.error('❌ Error creating file from cloud storage:', error);
      throw new Error(`Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
