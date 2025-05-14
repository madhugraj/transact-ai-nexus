
import { ApiResponse } from './types';

/**
 * Convert a File object to base64 string for API transmission
 */
export const fileToBase64 = async (file: File): Promise<string> => {
  console.log(`Converting file to base64: ${file.name}, type: ${file.type}, size: ${file.size}`);
  
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Content = base64String.split(',')[1];
        console.log(`Base64 conversion successful, length: ${base64Content.length}`);
        resolve(base64Content);
      } catch (error) {
        console.error("Error extracting base64 content:", error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      reject(error);
    };
    
    try {
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error reading file as data URL:", error);
      reject(error);
    }
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
  console.log(`Processing image with Gemini, prompt: "${prompt.substring(0, 50)}...", mimeType: ${mimeType}`);
  
  try {
    // For development, return mock data since we don't have a real backend
    // In a real app, this would call the Gemini API
    console.log("MOCK API: Using mock Gemini Vision API response");
    
    // Mock delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate different mock responses based on mime type
    let mockResponse: string;
    
    if (mimeType === 'application/pdf') {
      mockResponse = `
Sample Bank Statement
Account Number: XXXX-XXXX-1234
Statement Period: 01/25/2023 - 02/25/2023

Transaction History:
Date       | Description           | Amount    | Balance
-----------|-----------------------|-----------|----------
01/27/2023 | GROCERY STORE         | -$125.65  | $3,245.89
01/30/2023 | DIRECT DEPOSIT SALARY | +$2,450.00| $5,695.89
02/03/2023 | RENT PAYMENT          | -$1,800.00| $3,895.89
02/10/2023 | ONLINE PURCHASE       | -$79.99   | $3,815.90
02/15/2023 | RESTAURANT            | -$65.43   | $3,750.47
02/20/2023 | UTILITY BILL          | -$124.56  | $3,625.91

Account Summary:
Starting Balance: $3,371.54
Total Deposits: $2,450.00
Total Withdrawals: $2,195.63
Ending Balance: $3,625.91
      `;
    } else if (mimeType.startsWith('image/')) {
      mockResponse = `
Invoice #INV-2023-0568
Date: February 18, 2023

Bill To:
John Smith
123 Main Street
Anytown, CA 12345

Items:
1. Web Development Services - $2,500.00
2. Hosting (Annual) - $240.00
3. Domain Registration - $15.99

Subtotal: $2,755.99
Tax (8%): $220.48
Total: $2,976.47

Payment due within 30 days.
Thank you for your business!
      `;
    } else {
      mockResponse = "Extracted content would appear here based on the document type.";
    }
    
    console.log("Mock Gemini response:", mockResponse.substring(0, 100) + "...");
    
    return {
      success: true,
      data: mockResponse
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
  console.log(`Generating insights with Gemini, content length: ${content.length}`);
  console.log(`Prompt: "${prompt.substring(0, 50)}..."`);
  
  try {
    // For development, return mock data since we don't have a real backend
    console.log("MOCK API: Using mock Gemini text analysis response");
    
    // Mock delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Choose mock response based on content
    const hasBankingTerms = content.toLowerCase().includes('bank') || 
                           content.toLowerCase().includes('statement') ||
                           content.toLowerCase().includes('account');
    
    let mockResponse;
    
    if (hasBankingTerms) {
      mockResponse = {
        insights: "This document appears to be a bank statement with a comprehensive transaction history and account summary. The statement shows a healthy financial position with a positive cash flow.",
        summary: "Monthly bank statement showing transactions between January 25 and February 25, 2023, with an ending balance of $3,625.91.",
        keyPoints: [
          "The account received a salary deposit of $2,450.00 on January 30",
          "The largest expense was rent payment of $1,800.00",
          "The account maintained a positive balance throughout the period",
          "Total withdrawals ($2,195.63) were less than total deposits ($2,450.00)"
        ]
      };
    } else {
      mockResponse = {
        insights: "The document contains structured financial information that appears to be an invoice for services rendered. The invoice includes itemized services, tax calculations, and payment terms.",
        summary: "Invoice #INV-2023-0568 for web development services, hosting, and domain registration with a total of $2,976.47 due within 30 days.",
        keyPoints: [
          "Web development is the highest cost item at $2,500.00",
          "Tax rate applied is 8%",
          "Payment terms are 30 days",
          "Includes recurring annual services (hosting)"
        ]
      };
    }
    
    console.log("Mock Gemini insights:", mockResponse);
    
    return {
      success: true,
      data: mockResponse
    };
  } catch (error) {
    console.error("Gemini Text API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error generating insights with Gemini'
    };
  }
};
