
import { Agent, ProcessingContext, ProcessingResult } from "./types";
import * as api from '@/services/api';
import { UploadedFile } from "@/types/fileUpload";

export class DataInputAgent implements Agent {
  id: string = "DataInput";
  name: string = "Data Input Agent";
  description: string = "Handles file input and uploads to the server";
  
  async process(files: UploadedFile[], context?: ProcessingContext): Promise<any> {
    // Extract backend IDs from successfully uploaded files
    const backendFileIds = files
      .filter(file => file.backendId && file.status === "success")
      .map(file => file.backendId as string);
    
    if (backendFileIds.length === 0) {
      throw new Error("No files ready for processing");
    }
    
    return {
      fileIds: backendFileIds,
      count: backendFileIds.length,
      fileTypes: this.categorizeFiles(files)
    };
  }
  
  canProcess(data: any): boolean {
    return Array.isArray(data) && 
           data.length > 0 && 
           data[0] && 
           typeof data[0] === 'object' && 
           'file' in data[0];
  }
  
  categorizeFiles(files: UploadedFile[]): { documents: number, dataFiles: number, other: number } {
    const result = { documents: 0, dataFiles: 0, other: 0 };
    
    files.forEach(file => {
      const type = file.file.type;
      if (type === 'application/pdf' || type.startsWith('image/')) {
        result.documents++;
      } else if (type.includes('excel') || type.includes('spreadsheet') || type === 'text/csv') {
        result.dataFiles++;
      } else {
        result.other++;
      }
    });
    
    return result;
  }
}
