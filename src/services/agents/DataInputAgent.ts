
import { Agent, ProcessingContext } from "./types";
import * as api from '@/services/api';
import { UploadedFile } from '@/types/fileUpload';

export class DataInputAgent implements Agent {
  id: string = "DataInput";
  name: string = "Data Input Agent";
  description: string = "Processes input files and prepares them for further processing";
  
  async process(data: UploadedFile[], context?: ProcessingContext): Promise<any> {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No files to process");
    }
    
    // Count file types for decision making by other agents
    const fileTypes = {
      documents: 0,
      spreadsheets: 0,
      images: 0,
      others: 0
    };
    
    // Get backend file IDs for uploaded files
    const fileIds: string[] = [];
    const fileObjects: File[] = [];
    
    for (const file of data) {
      // Only process files that have been uploaded to the backend
      if (file.status === 'success' && file.backendId) {
        fileIds.push(file.backendId);
        
        // Categorize files
        const fileType = file.file.type;
        if (fileType.includes('pdf') || fileType.includes('document')) {
          fileTypes.documents++;
        } else if (fileType.includes('spreadsheet') || fileType.includes('csv') || fileType.includes('excel')) {
          fileTypes.spreadsheets++;
        } else if (fileType.includes('image')) {
          fileTypes.images++;
        } else {
          fileTypes.others++;
        }
        
        // Store file objects for direct processing (like with Gemini)
        fileObjects.push(file.file);
      }
    }
    
    if (fileIds.length === 0) {
      throw new Error("No successfully uploaded files found");
    }
    
    // Generate a processing ID
    const processingId = `proc-${Date.now()}`;
    
    return {
      processingId,
      fileIds,
      fileObjects,
      fileTypes,
      timestamp: new Date().toISOString()
    };
  }
  
  canProcess(data: any): boolean {
    return Array.isArray(data) && data.length > 0;
  }
}
