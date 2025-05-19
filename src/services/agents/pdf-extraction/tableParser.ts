
import * as api from '@/services/api';

/**
 * Parse text response into structured table data
 */
export const parseTableFromText = async (text: string): Promise<{ headers: string[], rows: string[][] } | null> => {
  try {
    // Use Gemini to parse text into a structured table
    const parsePrompt = `
Parse the following text into a structured table. 
Extract header row and data rows. 
Return ONLY a JSON object with this format:
{
  "headers": ["Header1", "Header2", ...],
  "rows": [
    ["row1col1", "row1col2", ...],
    ["row2col1", "row2col2", ...],
    ...
  ]
}

Here's the text to parse:
${text}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: parsePrompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract JSON from the response
    const jsonMatch = resultText.match(/\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/);
    if (!jsonMatch) {
      console.error("No valid JSON found in response");
      return null;
    }
    
    const tableData = JSON.parse(jsonMatch[0]);
    
    if (!tableData.headers || !tableData.rows || !Array.isArray(tableData.headers) || !Array.isArray(tableData.rows)) {
      console.error("Invalid table structure in response");
      return null;
    }
    
    return {
      headers: tableData.headers,
      rows: tableData.rows
    };
  } catch (error) {
    console.error("Error parsing table from text:", error);
    return null;
  }
};

/**
 * Extract tables from a single PDF page image
 */
export const extractTablesFromPageImage = async (
  base64Image: string, 
  fileName: string, 
  pageNum: number, 
  totalPages: number
): Promise<any[]> => {
  // Customize the prompt to indicate we're processing a single page
  const tablePrompt = `
Extract all tables from this document image (page ${pageNum} of ${totalPages}).
Format each table with proper column headers and rows.
Return tables in JSON format only.
`;

  try {
    const response = await api.processImageWithGemini(tablePrompt, base64Image, 'image/png');
    
    if (response.success && response.data) {
      console.log(`Successfully extracted content from page ${pageNum}`);
      
      // Parse the table data from the text response
      const tableData = await parseTableFromText(response.data);
      
      if (tableData) {
        return [{
          tableId: `pdf-table-p${pageNum}-${Date.now()}`,
          source: fileName,
          title: `Table from ${fileName} (Page ${pageNum})`,
          headers: tableData.headers,
          rows: tableData.rows,
          confidence: 0.9,
          pageNumber: pageNum
        }];
      }
    }
    
    return [];
  } catch (error) {
    console.error(`Error extracting tables from page ${pageNum}:`, error);
    return [];
  }
};
