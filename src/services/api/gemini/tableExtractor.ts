
// Define a default extraction prompt that can be exported
export const DEFAULT_TABLE_EXTRACTION_PROMPT = `
You're an OCR assistant specializing in extracting tables from images. Read this scanned document image and extract ALL tables found in it, with a focus on inventory or invoice data.

For each table:
1. Extract all column headers exactly as they appear
2. Extract all rows with their data
3. Maintain the exact structure of the table
4. Preserve all text values as they appear in the image

FORMAT YOUR RESPONSE AS JSON:
{
  "tables": [
    {
      "headers": ["Item Name", "Quantity", "Unit Price", "Total"],
      "rows": [
        ["Dell XPS Laptop", "2", "$1200", "$2400"],
        ["HP Printer", "1", "$350", "$350"]
      ]
    }
  ]
}

Only return valid JSON with no additional text, explanations or markdown.
`;

export interface ColumnDefinition {
  header: string;
  accessor: string;
  format?: (value: any) => string;
}

export interface TableDetectionResponse {
  tables: Array<{
    headers: string[];
    rows: any[][];
    columns?: ColumnDefinition[];
    title?: string; // Make title optional
  }>;
}

/**
 * Extract tables from an image using Google's Gemini API
 */
export async function extractTablesFromImageWithGemini(
  base64Image: string, 
  mimeType: string,
  customPrompt?: string // Make the third parameter optional
): Promise<{ success: boolean; data?: TableDetectionResponse; error?: string }> {
  try {
    // Use custom prompt if provided, otherwise use the default
    const prompt = customPrompt || DEFAULT_TABLE_EXTRACTION_PROMPT;

    console.info("Extracting tables from image using prompt: \n", prompt);
    
    // Use Gemini API key from environment or from localStorage if running in browser
    const apiKey = typeof window !== 'undefined' 
      ? localStorage.getItem('GEMINI_API_KEY') || 'AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk'
      : 'AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk';

    // Call the Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image.replace(/^data:image\/\w+;base64,/, '')
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096
          }
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract JSON from response text
    const jsonMatch = responseText.match(/\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in the response");
    }
    
    console.log("Raw Gemini response:", responseText);
    
    // Parse the JSON content
    const parsedData = JSON.parse(jsonMatch[0]);
    
    // Validate the response format
    if (!parsedData.tables || !Array.isArray(parsedData.tables)) {
      throw new Error("Invalid response format: 'tables' array not found");
    }
    
    return {
      success: true,
      data: parsedData as TableDetectionResponse
    };
  } catch (error) {
    console.error("Error processing image with Gemini:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
