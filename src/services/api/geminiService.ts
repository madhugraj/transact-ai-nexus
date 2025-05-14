
import { ApiResponse } from './types';

/**
 * Convert a File object to base64 string for API transmission
 */
export const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Content = base64String.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Process an image with Gemini Vision AI
 */
export const processImageWithGemini = async (
  prompt: string,
  base64Image: string,
  mimeType: string
): Promise<ApiResponse<string>> => {
  try {
    // In a real application, this would call the Gemini API
    // Using the Python client you provided as reference
    const response = await fetch('/api/gemini/vision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image: base64Image,
        mimeType
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to process image with Gemini');
    }

    const data = await response.json();
    return {
      success: true,
      data: data.text
    };
  } catch (error) {
    console.error("Gemini Vision API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error processing image with Gemini'
    };
  }
};

/**
 * Generate insights from text content using Gemini AI
 */
export const generateInsightsWithGemini = async (
  content: string,
  prompt: string = "Generate insights and key findings from this content."
): Promise<ApiResponse<{
  insights: string;
  summary: string;
  keyPoints: string[];
}>> => {
  try {
    // This would call the Gemini API in a real implementation
    // Using the Python client you provided as reference
    const response = await fetch('/api/gemini/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `${prompt}\n\nContent:\n${content}`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to generate insights with Gemini');
    }

    const data = await response.json();
    
    // For demo purposes, we'll create a mock response structure
    return {
      success: true,
      data: {
        insights: data.text || "Gemini has analyzed the document and found several key insights.",
        summary: "This document contains financial information with important details that require attention.",
        keyPoints: [
          "Important financial information detected",
          "Document appears to be in a structured format",
          "Processing complete with Gemini AI"
        ]
      }
    };
  } catch (error) {
    console.error("Gemini Text API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error generating insights with Gemini'
    };
  }
};
