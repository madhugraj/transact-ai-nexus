
import { Agent, ProcessingContext } from "./types";

export class DataInputAgent implements Agent {
  id: string = "DataInput";
  name: string = "Data Input Agent";
  description: string = "Prepares files for processing in the agent system";
  
  async process(data: any, context?: ProcessingContext): Promise<any> {
    console.log("🤖 DataInputAgent processing with data:", {
      fileCount: Array.isArray(data) ? data.length : 0,
      dataType: typeof data,
      isArray: Array.isArray(data)
    });
    
    // Extract file objects for further processing
    const files = Array.isArray(data) ? data : [];
    console.log(`DataInputAgent found ${files.length} files for processing`);
    
    // Count file types for processing decisions
    const fileTypes = this.countFileTypes(files);
    
    // Create an array of File objects for downstream processing
    const fileObjects = files
      .filter(file => file.file instanceof File)
      .map(file => file.file);
    
    console.log("Prepared file objects:", {
      count: fileObjects.length,
      types: fileObjects.map(f => f.type),
      names: fileObjects.map(f => f.name)
    });
    
    // Initialize processing ID
    const processingId = `process-${Date.now()}`;
    
    // Get file IDs
    const fileIds = files.map(file => file.id);
    
    // Return structured data for next agents
    return {
      processingId,
      fileIds,
      fileObjects,
      fileTypes,
      processedBy: 'DataInputAgent'
    };
  }
  
  canProcess(data: any): boolean {
    const canProcess = Array.isArray(data) && data.length > 0;
    console.log("DataInputAgent.canProcess:", canProcess);
    return canProcess;
  }
  
  private countFileTypes(files: any[]): Record<string, number> {
    const counts = {
      documents: 0,
      images: 0,
      data: 0,
      other: 0
    };
    
    files.forEach(file => {
      if (!file.file) return;
      
      const { type } = file.file;
      
      if (type === 'application/pdf') {
        counts.documents++;
      } else if (type.startsWith('image/')) {
        counts.images++;
      } else if (type === 'text/csv' || type.includes('excel') || type.includes('spreadsheet')) {
        counts.data++;
      } else {
        counts.other++;
      }
    });
    
    return counts;
  }
}
