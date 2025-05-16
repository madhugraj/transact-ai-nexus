
import { ApiResponse } from '../types';

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
    
    // Get the API key from environment variables or local storage
    // Replace Deno.env with process.env and add fallback to localStorage
    const geminiApiKey = process.env.Gemini_key || localStorage.getItem('Gemini_key');
    
    if (!geminiApiKey) {
      console.error("Gemini API key not found");
      return {
        success: false,
        error: "Gemini API key not configured"
      };
    }
    
    console.log("Using table context length:", tableContext.length);
    console.log("Analysis prompt length:", analysisPrompt.length);
    
    // Call the Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: analysisPrompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return {
        success: false,
        error: `Gemini API error: ${response.status} ${errorText}`
      };
    }

    const data = await response.json();
    const insights = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!insights) {
      return {
        success: false,
        error: "No insights were generated from Gemini"
      };
    }
    
    return {
      success: true,
      data: {
        insights: insights
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
