/**
 * Table extraction service using Gemini Vision
 */
import { ApiResponse } from '../types';
import { processImageWithGemini } from './visionService';

/**
 * Default prompt template for table extraction
 */
export const DEFAULT_TABLE_EXTRACTION_PROMPT = `
  Extract all tables from this document and convert to structured data.
  Return a clean JSON array of table objects with this structure:
  [
    {
      "title": "Table title if present",
      "headers": ["Header1", "Header2", ...],
      "rows": [
        ["row1col1", "row1col2", ...],
        ["row2col1", "row2col2", ...],
        ...
      ]
    },
    {
      "title": "Second table title",
      "headers": [...],
      "rows": [...]
    }
  ]
  ONLY return the JSON array. No explanation text.
`;

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
