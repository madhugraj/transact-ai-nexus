
import { ApiResponse } from '../types';

/**
 * Generate insights from table data using Gemini API
 */
export const generateInsightsWithGemini = async (
  tableData: string, 
  prompt: string
): Promise<ApiResponse<{ insights: string; summary?: string }>> => {
  try {
    console.log("Generating insights with Gemini using prompt:", prompt.substring(0, 100) + "...");
    
    // Make the API call to Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const insights = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      success: true,
      data: {
        insights,
        summary: insights.substring(0, 100) + '...'
      }
    };
  } catch (error) {
    console.error("Error generating insights with Gemini:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
