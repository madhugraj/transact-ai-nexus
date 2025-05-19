
/**
 * Table extraction service using Gemini Vision
 */
import { ApiResponse } from '../types';
import { processImageWithGemini } from './visionService';

/**
 * Default prompt template for table extraction - improved to ensure consistent JSON format
 */
export const DEFAULT_TABLE_EXTRACTION_PROMPT = `
You're an OCR assistant specializing in extracting tables from images. Read this scanned document image and extract structured data.
If the image has Checks, mention that it is a check image and extract the values accordingly.

Instructions:
- Extract all tabular structures from the image.
- Identify appropriate titles for tables based on their content.
- Preserve the exact column headers as they appear in the image.
- Extract all rows with their data, maintaining the original format when possible.
- For numerical values, extract them as numbers without currency symbols when appropriate.
- Avoid any logos or text not part of a structured table.

ALWAYS output in this exact JSON format:

\`\`\`json
{
  "tables": [
    {
      "title": "extracted heading or descriptive table name",
      "headers": ["Column A", "Column B", "Column C"],
      "rows": [
        ["value1", "value2", "value3"],
        ["value4", "value5", "value6"]
      ]
    }
  ]
}
\`\`\`

If there are multiple tables, include all of them in the "tables" array.
If there are no tables in the image, return an empty tables array.
Do not include any explanatory text outside the JSON structure.`;

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
  
  // Try to extract JSON from the response with improved patterns
  try {
    // Enhanced JSON extraction with multiple fallback patterns
    // First look for JSON code blocks with the 'json' label
    let jsonMatch = response.data.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    
    // If not found, try JSON code blocks without the 'json' label
    if (!jsonMatch) {
      jsonMatch = response.data.match(/```\s*(\{[\s\S]*?\})\s*```/);
    }
    
    // If still not found, look for standalone JSON object with tables property
    if (!jsonMatch) {
      jsonMatch = response.data.match(/(\{[\s\S]*"tables"[\s\S]*\})/);
    }
    
    // Last resort: try to find any JSON object
    if (!jsonMatch) {
      jsonMatch = response.data.match(/(\{[\s\S]*\})/);
    }
                     
    if (jsonMatch) {
      const jsonStr = jsonMatch[1];
      
      try {
        const parsedData = JSON.parse(jsonStr.trim());
        console.log("Successfully extracted table data:", parsedData);
        
        // Validate and normalize the structure of the parsed data
        if (!parsedData.tables || !Array.isArray(parsedData.tables)) {
          console.log("Invalid table structure in extracted JSON, attempting to normalize");
          
          // Try to normalize to expected format if data has headers and rows
          if (parsedData.headers && parsedData.rows) {
            return {
              success: true,
              data: {
                tables: [{
                  title: parsedData.title || "Extracted Table",
                  headers: parsedData.headers,
                  rows: parsedData.rows
                }]
              }
            };
          }
          
          // If we have a nested structure with table data
          if (parsedData.data && parsedData.data.headers && parsedData.data.rows) {
            return {
              success: true,
              data: {
                tables: [{
                  title: parsedData.title || "Extracted Table",
                  headers: parsedData.data.headers,
                  rows: parsedData.data.rows
                }]
              }
            };
          }
          
          return {
            success: false,
            error: "Invalid table structure in extracted JSON"
          };
        }
        
        // Ensure each table has the expected properties
        const validatedTables = parsedData.tables.filter(table => {
          return table && table.headers && Array.isArray(table.headers) && 
                 table.rows && Array.isArray(table.rows);
        });
        
        if (validatedTables.length === 0) {
          return {
            success: false,
            error: "No valid tables found in the extracted JSON"
          };
        }
        
        return {
          success: true,
          data: {
            tables: validatedTables
          }
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
