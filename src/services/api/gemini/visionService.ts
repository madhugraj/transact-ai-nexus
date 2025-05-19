
import { fileToBase64 } from './fileUtils';

/**
 * Process an image using Google's Gemini Vision API
 */
export async function processImageWithGemini(
  prompt: string,
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    console.info("Processing image with Gemini API, prompt length:", prompt.length, ", image length:", base64Image.length);
    
    // Use Gemini API key from environment or from localStorage if running in browser
    const apiKey = typeof window !== 'undefined' 
      ? localStorage.getItem('GEMINI_API_KEY') || 'AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk'
      : 'AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk';
    
    // Call Google's Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image.replace(/^data:image\/\w+;base64,/, '')
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 4096
          }
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return {
      success: true,
      data: text
    };
    
  } catch (error) {
    console.error("Error processing image with Gemini:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export { fileToBase64 };
