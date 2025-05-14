
import { ApiResponse } from './types';

/**
 * Convert a file to base64 for processing
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Process an image with Gemini Vision API
 */
export const processImageWithGemini = async (
  prompt: string, 
  base64Image: string,
  mimeType: string
): Promise<ApiResponse<string>> => {
  console.log(`Processing image with Gemini, prompt: ${prompt}, image length: ${base64Image.length}`);

  // For development, return mock results
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockResult = 
      `Bank Statement
      Account Number: XXXX-XXXX-1234
      Statement Period: 01/25/2023 - 02/25/2023

      Transaction History:
      Date       | Description           | Amount    | Balance
      -----------|-----------------------|-----------|----------
      01/27/2023 | GROCERY STORE         | -$125.65  | $3,245.89
      01/30/2023 | DIRECT DEPOSIT SALARY | +$2,450.00| $5,695.89
      02/03/2023 | RENT PAYMENT          | -$1,800.00| $3,895.89
      02/10/2023 | ONLINE PURCHASE       | -$79.99   | $3,815.90`;
      
      resolve({
        success: true,
        data: mockResult
      });
    }, 1500);
  });
};

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
  
  // For development, return mock insights
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          summary: "This is a bank statement showing transactions from January to February 2023 with a starting balance of $3,371.54 and ending balance of $3,625.91.",
          keyPoints: [
            "The account had one major deposit of $2,450.00 from a salary payment",
            "The largest expense was rent at $1,800.00",
            "There were 6 transactions total in this statement period",
            "The overall balance increased by $254.37"
          ],
          insights: "The statement shows a healthy financial pattern with income exceeding expenses. The major expense (rent) represents approximately 73% of the monthly income."
        }
      });
    }, 1000);
  });
};
