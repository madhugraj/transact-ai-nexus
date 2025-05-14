
import { Agent, ProcessingContext } from "./types";
import { UploadedFile } from "@/types/fileUpload";

export class DataInputAgent implements Agent {
  id: string = "DataInput";
  name: string = "Data Input Agent";
  description: string = "Processes input files and prepares them for the agent pipeline";
  
  async process(data: any, context?: ProcessingContext): Promise<any> {
    console.log("🤖 DataInputAgent starting processing");
    
    // Extract files from input data (should be an array of UploadedFile objects)
    const files = this.validateAndExtractFiles(data);
    
    if (files.length === 0) {
      throw new Error("No valid files provided for processing");
    }
    
    // Count file types
    const fileTypes = this.countFileTypes(files);
    
    // Get backend file IDs for processing
    const fileIds = files
      .filter(file => file.backendId)
      .map(file => file.backendId as string);
    
    // Get actual File objects for direct processing with Gemini
    const fileObjects = files
      .filter(file => file.file)
      .map(file => file.file);
    
    console.log(`✅ DataInputAgent processed ${files.length} files (${fileTypes.documents} documents, ${fileTypes.data} data, ${fileTypes.images} images)`);
    
    // Generate a unique processing ID
    const processingId = `proc_${Date.now()}`;
    
    return {
      processingId,
      fileIds,
      fileObjects,
      fileTypes,
      totalFiles: files.length
    };
  }
  
  canProcess(data: any): boolean {
    // Can process if data is an array with at least one valid file
    return Array.isArray(data) && data.length > 0;
  }
  
  private validateAndExtractFiles(data: any): UploadedFile[] {
    if (!Array.isArray(data)) {
      console.error("Data is not an array:", data);
      return [];
    }
    
    return data.filter(item => {
      const isValid = item && 
        typeof item === 'object' && 
        'id' in item && 
        ('file' in item || 'backendId' in item);
      
      if (!isValid) {
        console.warn("Invalid file item:", item);
      }
      
      return isValid;
    });
  }
  
  private countFileTypes(files: UploadedFile[]): { documents: number; data: number; images: number } {
    const result = { documents: 0, data: 0, images: 0 };
    
    for (const file of files) {
      if (!file.file) continue;
      
      const type = file.file.type;
      
      if (type === 'application/pdf') {
        result.documents++;
      } else if (type.startsWith('image/')) {
        result.images++;
      } else if (
        type === 'text/csv' || 
        type === 'application/vnd.ms-excel' || 
        type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        result.data++;
      } else {
        // Unknown file type, assume document
        result.documents++;
      }
    }
    
    return result;
  }
}
