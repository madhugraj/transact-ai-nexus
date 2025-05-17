
/**
 * Table extraction service using Gemini Vision
 */
import { ApiResponse } from '../types';
import { processImageWithGemini } from './visionService';

/**
 * Default prompt template for table extraction
 */
export const DEFAULT_TABLE_EXTRACTION_PROMPT = `
You're an OCR assistant. Read this scanned document image and extract clean, structured text.
You are also an expert in extracting tables from scanned images.
If the image has Checks, Mention that it is a check image and extract the values accordingly.
- Give appropriate title for the image according to the type of image.
Instructions:
- Extract all clear tabular structures from the image.
- Extract all possible tabular structures with data from the image
- Extract the Headings of the table {extracted heading}
- Avoid any logos or text not part of a structured table.
- Output JSON only in the format:

\`\`\`json
{
  "tables": [
    {
      "title": "extracted heading",
      "headers": ["Column A", "Column B"],
      "rows": [
        ["value1", "value2"],
        ...
      ]
    }
  ]
}
\`\`\``;

/**
 * Extract tables from an image using Gemini Vision with custom prompt
 */
export const extractTablesFromImageWithGemini = async (
  base64Image: string,
  mimeType: string,
  customPrompt?: string
): Promise<ApiResponse<any>> => {
  // Use custom prompt if provided, otherwise use default
  const tableExtractionPrompt = customPrompt || DEFAULT_TABLE_EXTRACTION_PROMPT;

  console.log("Extracting tables from image using prompt:", tableExtractionPrompt.substring(0, 100) + "...");
  
  const response = await processImageWithGemini(tableExtractionPrompt, base64Image, mimeType);
  
  if (!response.success) {
    return response;
  }
  
  // Try to extract JSON from the response
  try {
    // Enhanced JSON extraction pattern to handle different formats
    const jsonMatch = 
      // Look for JSON code blocks
      response.data.match(/```json\s*(\{[\s\S]*?\})\s*```/) || 
      // Look for JSON code blocks without the 'json' label
      response.data.match(/```\s*(\{[\s\S]*?\})\s*```/) ||
      // Look for JSON patterns
      response.data.match(/\{[\s\S]*"tables"[\s\S]*\}/) ||
      // Look for any object pattern
      response.data.match(/\{[\s\S]*\}/);
                     
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      
      try {
        const parsedData = JSON.parse(jsonStr.trim());
        console.log("Successfully extracted table data:", parsedData);
        
        // Validate the structure of the parsed data
        if (!parsedData.tables || !Array.isArray(parsedData.tables)) {
          console.error("Invalid table structure in extracted JSON, missing 'tables' array");
          
          // Try to construct a valid structure if possible
          if (parsedData.headers && parsedData.rows) {
            return {
              success: true,
              data: {
                tables: [{
                  title: "Extracted Table",
                  headers: parsedData.headers,
                  rows: parsedData.rows
                }]
              }
            };
          }
          
          return {
            success: false,
            error: "Invalid table structure in extracted JSON"
          };
        }
        
        return {
          success: true,
          data: parsedData
        };
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        console.error("JSON string that failed to parse:", jsonStr);
        return {
          success: false,
          error: "Failed to parse extracted JSON"
        };
      }
    } else {
      console.error("Could not find JSON in response:", response.data);
      return {
        success: false,
        error: "Could not extract table JSON from response"
      };
    }
  } catch (error) {
    console.error("Error parsing JSON from Gemini response:", error);
    console.error("Raw response:", response.data);
    return {
      success: false,
      error: "Failed to parse table data from Gemini response"
    };
  }
};
