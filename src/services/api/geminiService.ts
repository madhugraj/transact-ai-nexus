
// Gemini AI API client for text and vision models
import { ApiResponse } from './types';

// Configuration constants
const GEMINI_API_KEY = "AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk"; // Note: In production, this should come from environment variables
const GEMINI_TEXT_MODEL = "gemini-2.0-flash";
const GEMINI_VISION_MODEL = "gemini-2.0-flash-001";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models";

// Types for Gemini requests and responses
interface GeminiTextRequest {
  contents: {
    parts: {
      text: string;
    }[];
  }[];
}

interface GeminiVisionRequest {
  contents: {
    parts: (
      | { text: string }
      | { inline_data: { mime_type: string; data: string } }
    )[];
  }[];
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
  promptFeedback?: any;
}

/**
 * Process text prompts with Gemini
 */
export async function processTextWithGemini(prompt: string): Promise<ApiResponse<string>> {
  try {
    const requestBody: GeminiTextRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    };

    const response = await fetch(
      `${GEMINI_API_URL}/${GEMINI_TEXT_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: `Gemini API error: ${errorData.error?.message || response.statusText}` 
      };
    }

    const data: GeminiResponse = await response.json();
    if (data.candidates && data.candidates.length > 0) {
      const text = data.candidates[0].content.parts
        .map((part) => part.text)
        .join("");
      return { success: true, data: text };
    }

    return { 
      success: false, 
      error: "No response generated from Gemini" 
    };
  } catch (error) {
    console.error("Gemini text processing error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to process text with Gemini" 
    };
  }
}

/**
 * Process image with Gemini Vision
 */
export async function processImageWithGemini(
  prompt: string,
  imageBase64: string,
  mimeType = "image/jpeg"
): Promise<ApiResponse<string>> {
  try {
    const requestBody: GeminiVisionRequest = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
    };

    const response = await fetch(
      `${GEMINI_API_URL}/${GEMINI_VISION_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: `Gemini Vision API error: ${errorData.error?.message || response.statusText}` 
      };
    }

    const data: GeminiResponse = await response.json();
    if (data.candidates && data.candidates.length > 0) {
      const text = data.candidates[0].content.parts
        .map((part) => part.text)
        .join("");
      return { success: true, data: text };
    }

    return { 
      success: false, 
      error: "No response generated from Gemini Vision" 
    };
  } catch (error) {
    console.error("Gemini vision processing error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to process image with Gemini" 
    };
  }
}

/**
 * Convert a File object to base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = error => reject(error);
  });
}
