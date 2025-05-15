
/**
 * Gemini Vision API service for image and document processing
 */
import { ApiResponse } from '../types';

/**
 * Process an image with Gemini Vision API
 */
export const processImageWithGemini = async (
  prompt: string, 
  base64Image: string,
  mimeType: string
): Promise<ApiResponse<string>> => {
  console.log(`Processing image with Gemini API, prompt length: ${prompt.length}, image length: ${base64Image.length}`);
  
  try {
    // Using Gemini 1.5 Flash model instead of the deprecated Gemini Pro Vision
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
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image
                  }
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
    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    console.log("Gemini Vision API response:", extractedText ? extractedText.substring(0, 100) + "..." : "No text extracted");
    
    if (!extractedText) {
      return {
        success: false,
        error: "No text extracted from the image"
      };
    }
    
    return {
      success: true,
      data: extractedText
    };
  } catch (error) {
    console.error("Error processing image with Gemini:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
