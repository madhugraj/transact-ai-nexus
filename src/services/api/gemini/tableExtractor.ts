
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
): Promise<{ success: boolean; data: TableDetectionResponse; error?: string }> {
  try {
    // Use custom prompt if provided, otherwise use the default
    const prompt = customPrompt || DEFAULT_TABLE_EXTRACTION_PROMPT;

    console.info("Extracting tables from image using prompt: \n", prompt);

    // Mock response for testing purposes 
    // In a real implementation, this would call an actual API
    const mockResponse = {
      success: true,
      data: {
        tables: [
          {
            headers: ["Item", "Quantity", "Unit Price", "Total"],
            rows: [
              ["Dell Laptop", "2", "$1200", "$2400"],
              ["HP Printer", "1", "$350", "$350"],
              ["Wireless Mouse", "5", "$25", "$125"],
              ["External HDD", "2", "$89", "$178"],
              ["27\" Monitor", "3", "$245", "$735"]
            ],
            title: "Inventory Items" // Add a title for demonstration
          }
        ]
      }
    };

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockResponse;

  } catch (error) {
    console.error("Error processing image with Gemini:", error);
    throw new Error("Failed to extract table from image");
  }
}
