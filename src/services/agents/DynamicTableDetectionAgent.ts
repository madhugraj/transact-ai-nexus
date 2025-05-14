
import { Agent, ProcessingContext } from "./types";
import * as api from '@/services/api';

export class DynamicTableDetectionAgent implements Agent {
  id: string = "DynamicTableDetection";
  name: string = "Dynamic Table Detection Agent";
  description: string = "Detects and extracts tables from document content using AI";
  
  async process(data: any, context?: ProcessingContext): Promise<any> {
    console.log("🤖 DynamicTableDetectionAgent processing with context:", context?.options?.useGemini);
    
    // Check if we have extracted text content from Gemini
    const useGemini = context?.options?.useGemini || false;
    const hasGeminiResults = data.geminiResults && data.geminiResults.length > 0;
    const extractedText = data.extractedTextContent || "";
    
    if (useGemini && hasGeminiResults) {
      console.log("Using Gemini for table detection and analysis");
      
      try {
        // Generate insights from the extracted text using Gemini
        const insightsResponse = await api.generateInsightsWithGemini(
          extractedText,
          "Analyze this extracted text. Identify any tables or structured data. Generate insights about the financial information contained in this document."
        );
        
        if (insightsResponse.success && insightsResponse.data) {
          return {
            ...data,
            dynamicTableDetection: true,
            insights: {
              summary: insightsResponse.data.summary,
              keyPoints: insightsResponse.data.keyPoints,
              rawInsights: insightsResponse.data.insights
            },
            extractionComplete: true
          };
        }
      } catch (error) {
        console.error("Failed to generate insights with Gemini:", error);
      }
    }
    
    // If Gemini failed or is not used, continue with standard processing
    return {
      ...data, 
      dynamicTableDetection: false,
      extractionComplete: true
    };
  }
  
  canProcess(data: any): boolean {
    return data && 
      (data.tables || data.extractedTextContent || (data.geminiResults && data.geminiResults.length > 0));
  }
}
