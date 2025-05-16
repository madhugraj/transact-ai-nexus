
/**
 * Utilities for document and table data processing
 */

/**
 * Ensures that a value is a string array
 */
export const ensureStringArray = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value.map(item => String(item));
  }
  return [];
};

/**
 * Ensures that a value is a 2D array
 */
export const ensure2DArray = (value: any): any[][] => {
  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    if (Array.isArray(value[0])) {
      return value;
    }
    return [value]; // Make it a 2D array with a single row
  }
  return [];
};

/**
 * Format table data for display and storage
 */
export const formatTableData = (table: any, source: 'supabase' | 'local' = 'local') => {
  return {
    id: table.id || `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: table.title || table.name || 'Extracted Table',
    type: 'table' as const,
    extractedAt: table.created_at || table.extractedAt || new Date().toISOString(),
    source,
    headers: ensureStringArray(table.headers),
    rows: ensure2DArray(table.rows),
    confidence: table.confidence || 0
  };
};

/**
 * Parse table data from raw extraction result
 * This ensures we handle all formats consistently
 */
export const parseExtractedTableData = (data: any) => {
  // If we have a tables array
  if (data.tables && Array.isArray(data.tables)) {
    return data.tables.map((table: any) => ({
      ...table,
      headers: ensureStringArray(table.headers),
      rows: ensure2DArray(table.rows)
    }));
  }
  
  // If we have direct headers and rows
  if (data.headers && data.rows) {
    return [{
      title: data.title || 'Extracted Table',
      headers: ensureStringArray(data.headers),
      rows: ensure2DArray(data.rows)
    }];
  }
  
  return [];
};

/**
 * Formats a raw JSON or text output from an AI into structured table data
 */
export const parseAITableOutput = (outputText: string) => {
  try {
    // Try to extract JSON from the response
    const jsonMatch = outputText.match(/```json\s*(\{[\s\S]*?\})\s*```/) || 
                    outputText.match(/\{[\s\S]*"tables"[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsedData = JSON.parse(jsonStr);
      
      // Return parsed tables with proper type conversion
      return parseExtractedTableData(parsedData);
    } 
    
    // If no JSON found, try to parse as text
    const lines = outputText.split('\n').filter(line => line.trim());
    
    // Simple heuristic: if we have multiple | characters, likely a table
    if (lines.some(line => line.includes('|'))) {
      const tableRows = lines.filter(line => line.includes('|'));
      
      // Get headers from first row
      const headers = tableRows[0]
        .split('|')
        .map(h => h.trim())
        .filter(h => h !== '');
      
      // Get data rows (skip header row and any separator row)
      const dataRows = tableRows
        .slice(1)
        .filter(row => !row.match(/^\s*[-|]+\s*$/)) // Skip separator rows
        .map(row => 
          row.split('|')
            .map(cell => cell.trim())
            .filter((_, i) => i > 0 && i <= headers.length)
        );
      
      return [{
        title: 'Extracted Table',
        headers,
        rows: dataRows
      }];
    }
    
    return [];
  } catch (error) {
    console.error("Error parsing AI table output:", error);
    return [];
  }
};
