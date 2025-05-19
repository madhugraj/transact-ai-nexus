
import { ApiResponse } from '../types';

/**
 * Process an image with Gemini Vision API
 * @param prompt The text prompt to send to Gemini
 * @param base64Image The base64-encoded image data
 * @param mimeType The MIME type of the image
 * @returns ApiResponse with the generated text
 */
export const processImageWithGemini = async (prompt: string, base64Image: string, mimeType?: string): Promise<ApiResponse<string>> => {
  console.log(`Processing image with Gemini API, prompt length: ${prompt.length}, image length: ${base64Image.length}`);
  
  try {
    // In a real implementation, this would send the image to Gemini Vision API
    // For now, we're using a mock implementation
    
    // Get the API key from environment variable or use a default mock key
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'mock-key';
    
    if (!apiKey || apiKey === 'mock-key') {
      console.log("Using mock Gemini API (no API key provided)");
      // Return simulated response
      return mockGeminiVisionAPI(prompt, base64Image);
    }
    
    // Here would be the actual API call to Gemini Vision
    // For now, return a mock response
    return mockGeminiVisionAPI(prompt, base64Image);
  } catch (error) {
    console.error("Error processing image with Gemini:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error processing image"
    };
  }
};

/**
 * Generate a mock response for simulating Gemini Vision API
 */
const mockGeminiVisionAPI = (prompt: string, base64Image: string): ApiResponse<string> => {
  // Simulate API processing time
  const imageType = determineImageType(base64Image);
  
  if (prompt.toLowerCase().includes('table')) {
    return mockTableExtraction();
  } else if (prompt.toLowerCase().includes('check')) {
    return mockCheckExtraction();
  }
  
  // Default document extraction mock
  return {
    success: true,
    data: `This is a mock extraction from a ${imageType} document. 
The document appears to be a financial statement with the following details:
- Date: May 15, 2023
- Account Number: XXXX-XXXX-1234
- Total Amount: $5,246.78

Several transactions are visible including:
- Deposit: $2,500.00 on May 1, 2023
- Withdrawal: $650.25 on May 3, 2023
- Payment: $1,250.00 to ACME Corp on May 10, 2023`
  };
};

/**
 * Mock table extraction response
 */
const mockTableExtraction = (): ApiResponse<string> => {
  return {
    success: true,
    data: `I've detected a table in the document with the following structure:

| Date | Description | Amount | Balance |
|------|-------------|--------|---------|
| 05/01/2023 | Deposit | $2,500.00 | $7,845.20 |
| 05/03/2023 | Withdrawal | $650.25 | $7,194.95 |
| 05/10/2023 | Payment - ACME Corp | $1,250.00 | $5,944.95 |
| 05/15/2023 | Service Fee | $35.00 | $5,909.95 |
| 05/22/2023 | Direct Deposit - Payroll | $3,200.00 | $9,109.95 |
| 05/28/2023 | Online Payment - Utilities | $245.67 | $8,864.28 |`
  };
};

/**
 * Mock check extraction response
 */
const mockCheckExtraction = (): ApiResponse<string> => {
  return {
    success: true,
    data: `This is a check image with the following details:
- Check Number: 1053
- Date: May 15, 2023
- Pay to the order of: ACME Corporation
- Amount: $1,250.00
- Memo: Invoice #A-12345
- Signature: Jane Smith
- Bank: First National Bank`
  };
};

/**
 * Try to determine what type of image we're processing based on the base64 content
 */
const determineImageType = (base64Image: string): string => {
  // In a real implementation, we might analyze the image to determine its type
  // For mock purposes, choose randomly
  const types = ['invoice', 'receipt', 'bank statement', 'tax form', 'financial report'];
  const randomIndex = Math.floor(Math.random() * types.length);
  return types[randomIndex];
};

/**
 * Convert a File to base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error('FileReader did not return a string'));
      }
    };
    reader.onerror = error => reject(error);
  });
};
