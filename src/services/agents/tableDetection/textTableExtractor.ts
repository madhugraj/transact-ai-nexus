
import * as api from '@/services/api';

/**
 * Extract tables from text using Gemini
 */
export async function extractTableFromText(text: string): Promise<{ 
  headers: string[], 
  rows: string[][], 
  metadata: any 
} | null> {
  try {
    // Use Gemini to extract table structure from text
    const prompt = `
You're an OCR assistant. Read this text and extract clean, structured tabular data.
You are an expert in extracting tables from text content.
Instructions:
- Extract all clear tabular structures from the text.
- Extract the Headings of the table
- Output JSON only in the format:

\`\`\`json
{
  "found": true,
  "headers": ["Column1", "Column2", ...],
  "rows": [
    ["row1col1", "row1col2", ...],
    ["row2col1", "row2col2", ...],
    ...
  ]
}
\`\`\`

TEXT:
${text}`;

    // Call the Gemini API directly to extract tables - updated to use gemini-1.5-flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
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
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract JSON from response text
    const jsonMatch = responseText.match(/\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/);
    if (!jsonMatch) {
      return null;
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);
    
    if (!parsedData.found) {
      return null;
    }
    
    return {
      headers: parsedData.headers || [],
      rows: parsedData.rows || [],
      metadata: {
        totalRows: (parsedData.rows || []).length,
        confidence: 0.8,
        sourceFile: "text-extraction"
      }
    };
  } catch (error) {
    console.error("Error extracting table from text:", error);
    return null;
  }
}
