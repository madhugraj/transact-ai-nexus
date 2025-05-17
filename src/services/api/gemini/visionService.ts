
/**
 * Gemini Vision API service for image and document processing
 */
import { ApiResponse } from '../types';
import { supabase } from '@/integrations/supabase/client';

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
 * Process an image with Gemini Vision API
 */
export const processImageWithGemini = async (
  prompt: string, 
  base64Image: string,
  mimeType: string
): Promise<ApiResponse<string>> => {
  console.log(`Processing image with Gemini API, prompt length: ${prompt.length}, image length: ${base64Image.length}`);
  
  try {
    // Get the Gemini API key from Supabase secrets
    const { data: secretData, error: secretError } = await supabase
      .rpc('get_secret', { secret_name: 'Gemini_key' });
    
    const geminiApiKey = secretData || 
                         localStorage.getItem('Gemini_key');
    
    if (!geminiApiKey) {
      console.error("Gemini API key not found in Supabase secrets or localStorage");
      return {
        success: false,
        error: "Gemini API key not configured. Please add it to Supabase secrets."
      };
    }
    
    // Using Gemini 1.5 Flash model instead of the deprecated Gemini Pro Vision
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192 // Increase for larger JSON responses
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return {
        success: false,
        error: `Gemini API error: ${response.status} ${errorText}`
      };
    }

    const data = await response.json();
    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    console.log("Gemini Vision API response:", extractedText ? extractedText.substring(0, 100) + "..." : "No text extracted");
    
    if (!extractedText) {
      return {
        success: false,
        error: "No text extracted from the image"
      };
    }
    
    return {
      success: true,
      data: extractedText
    };
  } catch (error) {
    console.error("Error processing image with Gemini:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Extract tables from an image using Gemini Vision
 */
export const extractTablesFromImageWithGemini = async (
  base64Image: string,
  mimeType: string,
  customPrompt?: string
): Promise<ApiResponse<{tables: any[]}>> => {
  const tableExtractionPrompt = customPrompt || DEFAULT_TABLE_EXTRACTION_PROMPT;
  
  try {
    const response = await processImageWithGemini(tableExtractionPrompt, base64Image, mimeType);
    
    if (!response.success) {
      // Type-safe conversion for error response
      return {
        success: false,
        error: response.error
      };
    }
    
    // Try to parse the JSON response
    try {
      // Look for JSON in the response
      const jsonMatch = response.data.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error("No valid JSON array found in the response");
        return {
          success: false,
          error: "Failed to extract table JSON from response"
        };
      }
      
      const tables = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(tables)) {
        console.error("Extracted data is not an array:", tables);
        return {
          success: false,
          error: "Extracted table data is not in the expected format"
        };
      }
      
      console.log(`Successfully extracted ${tables.length} tables from the image`);
      
      return {
        success: true,
        data: {
          tables: tables
        }
      };
    } catch (parseError) {
      console.error("Error parsing JSON from Gemini response:", parseError);
      return {
        success: false,
        error: "Failed to parse table data from Gemini response"
      };
    }
  } catch (error) {
    console.error("Error extracting tables:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};
