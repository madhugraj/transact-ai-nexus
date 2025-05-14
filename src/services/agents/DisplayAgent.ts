
import { Agent, ProcessingContext } from "./types";
import * as api from '@/services/api';

export class DisplayAgent implements Agent {
  id: string = "DisplayAgent";
  name: string = "Display Agent";
  description: string = "Prepares processed data for display with insights";
  
  async process(data: any, context?: ProcessingContext): Promise<any> {
    // Prepare processed data for display
    const displayData = {
      ...data,
      displayReady: true,
      timestamp: new Date().toISOString()
    };
    
    // Generate insights if we have normalized tables
    if (data.normalizedTables && data.normalizedTables.length > 0) {
      try {
        const insights = await this.generateInsightsWithGemini(data.normalizedTables);
        displayData.insights = insights;
      } catch (error) {
        console.error("Error generating insights:", error);
        displayData.insights = { error: "Failed to generate insights" };
      }
    }
    
    return displayData;
  }
  
  canProcess(data: any): boolean {
    return data && (data.normalizedTables || data.tables || data.extractedTextContent);
  }
  
  private async generateInsightsWithGemini(tables: any[]): Promise<any> {
    try {
      const prompt = `
        Analyze the following tables and provide insights:
        ${JSON.stringify(tables, null, 2)}
        
        Please provide:
        1. A summary of the data
        2. Key patterns or trends
        3. Any anomalies or outliers
        4. Suggested visualizations that would be useful
        
        Format your response as JSON with the following structure:
        {
          "summary": "...",
          "patterns": ["...", "..."],
          "anomalies": ["...", "..."],
          "visualizationSuggestions": ["...", "..."]
        }
      `;
      
      const geminiResponse = await api.processTextWithGemini(prompt);
      
      if (geminiResponse.success && geminiResponse.data) {
        try {
          return JSON.parse(geminiResponse.data);
        } catch (error) {
          return {
            summary: geminiResponse.data,
            generatedBy: "gemini"
          };
        }
      }
      
      return {
        summary: "No insights could be generated",
        generatedBy: "system"
      };
    } catch (error) {
      console.error("Error generating insights with Gemini:", error);
      throw error;
    }
  }
}
