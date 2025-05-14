
import { Agent, ProcessingContext } from "./types";

export class DynamicTableDetectionAgent implements Agent {
  id: string = "DynamicTableDetection";
  name: string = "Dynamic Table Detection Agent";
  description: string = "Identifies and normalizes table structures across different formats";
  
  async process(data: any, context?: ProcessingContext): Promise<any> {
    // Get extracted tables from previous agent
    const tables = data.tables || [];
    
    if (!tables.length) {
      return {
        ...data,
        normalizedTables: [],
        detectedStructures: []
      };
    }
    
    // Process each table to detect structure
    const normalizedTables = tables.map(table => this.normalizeTable(table));
    
    // Detect common structures across tables
    const detectedStructures = this.detectCommonStructures(normalizedTables);
    
    return {
      ...data,
      normalizedTables,
      detectedStructures,
      structureMetadata: {
        columnCount: this.getAverageColumnCount(normalizedTables),
        consistentHeaders: this.hasConsistentHeaders(normalizedTables),
        dataTypes: this.detectDataTypes(normalizedTables)
      }
    };
  }
  
  canProcess(data: any): boolean {
    return data && (data.tables || data.extractionComplete);
  }
  
  private normalizeTable(table: any) {
    // In real implementation, this would normalize table structure
    // For now, just pass through with metadata
    return {
      ...table,
      metadata: {
        columnCount: table.columns?.length || 0,
        rowCount: table.rows?.length || 0,
        hasHeaders: Boolean(table.headers?.length),
        headers: table.headers || []
      }
    };
  }
  
  private detectCommonStructures(tables: any[]) {
    // This would identify similar structures across tables
    // Simplified implementation for now
    const structures = [];
    
    if (tables.length > 0) {
      structures.push({
        type: "standard",
        columnCount: this.getAverageColumnCount(tables)
      });
    }
    
    return structures;
  }
  
  private getAverageColumnCount(tables: any[]) {
    if (tables.length === 0) return 0;
    const sum = tables.reduce((acc, table) => acc + (table.metadata?.columnCount || 0), 0);
    return Math.round(sum / tables.length);
  }
  
  private hasConsistentHeaders(tables: any[]) {
    if (tables.length <= 1) return true;
    
    // Compare headers of first table with others
    const firstHeaders = tables[0].metadata?.headers || [];
    return tables.every(table => {
      const headers = table.metadata?.headers || [];
      if (headers.length !== firstHeaders.length) return false;
      
      // Simplified comparison - in real implementation, would be more sophisticated
      return headers.length === firstHeaders.length;
    });
  }
  
  private detectDataTypes(tables: any[]) {
    // Simplified implementation for detecting common data types
    const types = {
      numeric: false,
      date: false,
      text: false
    };
    
    // In real implementation, would analyze cell contents
    types.text = true;
    
    return types;
  }
}
