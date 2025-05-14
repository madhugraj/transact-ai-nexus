
import { ApiResponse } from './types';

// Convert a File object to a base64 string
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    
    reader.onerror = error => {
      reject(error);
    };
  });
};

// Process an image with the Gemini API
export const processImageWithGemini = async (
  prompt: string, 
  base64Image: string,
  mimeType: string
): Promise<ApiResponse<string>> => {
  // In a real app, this would call the Gemini API
  console.log(`Processing image with Gemini: prompt=${prompt.substring(0, 30)}...`);
  
  // For demo purposes, we'll simulate a successful API call
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const responseText = `Sample extracted text from an ${mimeType} file.\n\nThis would be the actual content extracted by the Gemini API based on your prompt: "${prompt}"\n\nThe image would be analyzed for text, tables, and structured data.`;
    
    return {
      success: true,
      data: responseText
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in Gemini API'
    };
  }
};

// Generate insights using Gemini
export const generateInsightsWithGemini = async (
  content: string,
  prompt: string
): Promise<ApiResponse<any>> => {
  console.log(`Generating insights with Gemini: content length=${content.length}, prompt=${prompt.substring(0, 30)}...`);
  
  // For demo purposes, we'll simulate a successful API call
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      data: {
        summary: "This document appears to be a financial statement containing transaction history and account details. The data shows various debits and credits over a one-month period.",
        keyPoints: [
          "Total deposits: $2,450.00",
          "Total withdrawals: $2,195.63",
          "Net change: +$254.37",
          "Major expenses include rent payment ($1,800.00)"
        ],
        insights: "The largest transaction is a rent payment of $1,800.00, which represents approximately 82% of the total withdrawals. The account shows a positive cash flow during this period."
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in Gemini API'
    };
  }
};
