import { ApiResponse } from '../types';
import { supabase } from "@/integrations/supabase/client";

interface GeminiInsightResponse {
  insights?: string;
  summary?: string;
}

export const generateInsightsWithGemini = async (
  tableContext: string,
  analysisPrompt: string
): Promise<ApiResponse<GeminiInsightResponse>> => {
  try {
    console.log("Generating insights with Gemini API");
    
    // Debug the inputs
    console.log(`Table context (sample): ${tableContext.substring(0, 100)}...`);
    console.log(`Analysis prompt (sample): ${analysisPrompt.substring(0, 100)}...`);
    
    // Use explicit typing for the RPC call to ensure TypeScript correctness
    const { data } = await supabase.rpc<string[]>('get_service_key', {
      service_name: 'gemini'
    });
    
    // Process the response with proper typing
    const apiKeys = data || [];
    const apiKey = apiKeys.length > 0 ? apiKeys[0] : null;
    const hasValidKey = !!apiKey;
    
    if (!hasValidKey) {
      console.log("No Gemini API key found, using mock response");
      // This is where the generic mock response is being used
      return {
        success: true,
        data: {
          insights: "⚠️ This is a simulated response because the Gemini API key is not configured.\n\n" +
                   "To get real AI-powered insights on your data, please configure a Gemini API key in the settings.\n\n" +
                   "Based on the provided data, here is a sample of what insights would look like:\n\n" +
                   "1. The data shows potential patterns that would be analyzed in detail with the actual API.\n\n" +
                   "2. Key metrics would be automatically identified and trends highlighted.\n\n" +
                   "3. Anomalies and outliers would be detected and flagged for your attention."
        }
      };
    }
    
    // For a real implementation, we would call the Gemini API here
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a business data analyst. Analyze the following table data and provide specific insights:\n\n${tableContext}\n\n${analysisPrompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
    }
    
    const geminiResponse = await response.json();
    console.log("Gemini response received:", geminiResponse);
    
    // Extract insight text from the Gemini response
    let insightText = "";
    if (geminiResponse.candidates && geminiResponse.candidates.length > 0 && 
        geminiResponse.candidates[0].content && geminiResponse.candidates[0].content.parts) {
      insightText = geminiResponse.candidates[0].content.parts
        .filter(part => part.text)
        .map(part => part.text)
        .join("\n\n");
    }
    
    if (!insightText) {
      throw new Error("No insight text found in Gemini response");
    }
    
    return {
      success: true,
      data: {
        insights: insightText
      }
    };
  } catch (error) {
    console.error("Error generating insights with Gemini:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};
