
import { Agent, ProcessingContext } from "./types";

export class DataInputAgent implements Agent {
  id: string = "DataInput";
  name: string = "Data Input Agent";
  description: string = "Loads and validates input files for processing";
  
  async process(data: any, context?: ProcessingContext): Promise<any> {
    console.log("🤖 DataInputAgent processing started");
    
    // Handle both array of files and direct file objects
    const files = Array.isArray(data) ? data : [data];
    
    console.log(`Processing ${files.length} files:`, files.map(f => 
      f.file ? {name: f.file.name, type: f.file.type, size: f.file.size} : {id: f.id}
    ));
    
    // Count file types for downstream agents
    const fileTypes = this.countFileTypes(files);
    console.log("File types count:", fileTypes);
    
    // Extract file IDs
    const fileIds = files
      .filter(file => file.backendId)
      .map(file => file.backendId);
    
    // Store File objects for actual processing
    const fileObjects = files
      .filter(file => file.file instanceof File)
      .map(file => file.file);
      
    console.log(`Extracted ${fileIds.length} backend file IDs`);
    console.log(`Extracted ${fileObjects.length} File objects for processing`);
    
    if (fileObjects.length === 0 && fileIds.length === 0) {
      console.warn("No valid files found for processing");
      throw new Error("No valid files found for processing");
    }

    // Create a unique processing ID
    const processingId = `proc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    console.log(`Created processing ID: ${processingId}`);
    
    console.log("✅ DataInputAgent completed processing");
    
    // Return data for next agent in pipeline
    return {
      processingId,
      fileIds,
      fileObjects, // Pass the actual File objects for real processing
      fileTypes,
    };
  }
  
  canProcess(data: any): boolean {
    // Can process any input data that contains files
    const canProcess = data != null && (
      (Array.isArray(data) && data.length > 0) ||
      (data.file instanceof File) ||
      (data.backendId != null)
    );
    console.log("DataInputAgent.canProcess:", canProcess);
    return canProcess;
  }
  
  private countFileTypes(files: any[]): { documents: number; data: number; images: number; other: number } {
    const counts = { documents: 0, data: 0, images: 0, other: 0 };
    
    for (const file of files) {
      if (!file.file) {
        counts.other++;
        continue;
      }
      
      const type = file.file.type;
      
      if (type === 'application/pdf' || 
          type === 'application/msword' || 
          type.includes('officedocument.wordprocessing')) {
        counts.documents++;
      } else if (type.includes('spreadsheet') || 
                type === 'text/csv' || 
                type === 'application/vnd.ms-excel') {
        counts.data++;
      } else if (type.startsWith('image/')) {
        counts.images++;
      } else {
        counts.other++;
      }
    }
    
    return counts;
  }
}
