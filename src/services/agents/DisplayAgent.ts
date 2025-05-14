
import { Agent, ProcessingContext } from "./types";

export class DisplayAgent implements Agent {
  id: string = "DisplayAgent";
  name: string = "Display Agent";
  description: string = "Prepares processed data for display and visualization";
  
  async process(data: any, context?: ProcessingContext): Promise<any> {
    // Extract normalized tables from previous agents
    const tables = data.normalizedTables || data.tables || [];
    const processingId = data.processingId;
    
    // Prepare visualization data
    const visualizationData = this.prepareVisualizationData(tables);
    
    // Return processed display data
    return {
      processingId,
      displayReady: true,
      tables,
      visualizations: visualizationData,
      summary: this.generateSummary(tables, data),
      exportOptions: this.getExportOptions(tables)
    };
  }
  
  canProcess(data: any): boolean {
    return data && 
           (data.normalizedTables || data.tables || data.extractionComplete);
  }
  
  private prepareVisualizationData(tables: any[]) {
    // In a real implementation, this would prepare data for charts
    // For now, return a simplified structure
    return {
      charts: [
        {
          type: "bar",
          title: "Data Distribution",
          data: [] // Would be populated with actual data
        }
      ],
      insights: this.generateInsights(tables)
    };
  }
  
  private generateSummary(tables: any[], data: any) {
    return {
      tableCount: tables.length,
      totalRows: tables.reduce((sum, table) => sum + (table.rows?.length || 0), 0),
      processingTime: data.processingTime || "Unknown",
      fileTypes: data.fileTypes || {}
    };
  }
  
  private generateInsights(tables: any[]) {
    return [
      "Data patterns detected in column 2",
      "Possible date formats found in column 3",
      // More insights would be generated from actual data
    ];
  }
  
  private getExportOptions(tables: any[]) {
    return [
      { format: "CSV", available: true },
      { format: "Excel", available: true },
      { format: "JSON", available: true },
      { format: "Database", available: tables.length > 0 }
    ];
  }
}
