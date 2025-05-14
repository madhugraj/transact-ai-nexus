
import { Agent, ProcessingContext } from "./types";

export class DataInputAgent implements Agent {
  id: string = "DataInput";
  name: string = "Data Input Agent";
  description: string = "Processes input files and prepares them for extraction";
  
  async process(files: any[], context?: ProcessingContext): Promise<any> {
    console.log("🤖 DataInputAgent processing started", { 
      fileCount: files.length,
      context
    });
    
    // Get file types information
    const fileStats = this.getFileTypeStatistics(files);
    console.log("File statistics:", fileStats);
    
    // Generate processing ID
    const processingId = `process_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    console.log("Generated processing ID:", processingId);
    
    // Extract file IDs
    const fileIds = files
      .filter(file => file.backendId)
      .map(file => file.backendId);
    
    console.log("Extracted file IDs:", fileIds);
    
    // Extract file objects for direct manipulation
    const fileObjects = files
      .filter(file => file.file)
      .map(file => file.file);
    
    console.log("Extracted file objects:", fileObjects.map(f => f.name));
    
    // Return processed data for next agent
    return {
      processingId,
      fileIds,
      fileObjects,
      fileTypes: fileStats,
      timestamp: new Date().toISOString()
    };
  }
  
  canProcess(data: any): boolean {
    return Array.isArray(data) && data.length > 0;
  }
  
  // Helper method to categorize files
  private getFileTypeStatistics(files: any[]): { documents: number, images: number, data: number, other: number } {
    const stats = {
      documents: 0,
      images: 0,
      data: 0,
      other: 0
    };
    
    files.forEach(file => {
      if (!file.file) return;
      
      const type = file.file.type;
      
      if (type === 'application/pdf') {
        stats.documents++;
      } else if (type.startsWith('image/')) {
        stats.images++;
      } else if (
        type === 'text/csv' || 
        type === 'application/vnd.ms-excel' || 
        type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        stats.data++;
      } else {
        stats.other++;
      }
    });
    
    return stats;
  }
}
