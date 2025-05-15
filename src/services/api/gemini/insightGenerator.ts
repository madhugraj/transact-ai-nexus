
/**
 * Insight generation service using Gemini
 */
import { ApiResponse } from '../types';

/**
 * Generate insights from text using Gemini
 */
export const generateInsightsWithGemini = async (
  text: string,
  prompt: string
): Promise<ApiResponse<{
  summary: string;
  keyPoints: string[];
  insights: string;
}>> => {
  console.log(`Generating insights with Gemini, text length: ${text.length}`);
  
  try {
    // Update to use Gemini 1.5 Flash model for text generation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { 
                  text: `${prompt}

Here is the text to analyze:
${text}

Format your response as a structured JSON with these fields:
1. "summary": A concise summary of the document
2. "keyPoints": An array of key points as strings
3. "insights": A paragraph with insights about the financial information`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
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
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      return {
        success: false,
        error: "No insights generated from the text"
      };
    }
    
    // Extract JSON from the response text
    const jsonMatch = resultText.match(/\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/);
    
    if (!jsonMatch) {
      // If no JSON found, create a structured response from the text
      return {
        success: true,
        data: {
          summary: "Analysis of the document",
          keyPoints: resultText.split('\n').filter(line => line.trim().startsWith('- ')).map(line => line.trim().substring(2)),
          insights: resultText
        }
      };
    }
    
    try {
      const parsedData = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        data: {
          summary: parsedData.summary || "Analysis of the document",
          keyPoints: parsedData.keyPoints || [],
          insights: parsedData.insights || resultText
        }
      };
    } catch (parseError) {
      console.error("Error parsing Gemini response as JSON:", parseError);
      return {
        success: true,
        data: {
          summary: "Analysis of the document",
          keyPoints: resultText.split('\n').filter(line => line.trim().startsWith('- ')).map(line => line.trim().substring(2)),
          insights: resultText
        }
      };
    }
  } catch (error) {
    console.error("Error generating insights with Gemini:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
