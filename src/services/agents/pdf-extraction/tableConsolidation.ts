
/**
 * Create a signature for table headers to identify similar tables
 */
export const createHeaderSignature = (headers: string[]): string => {
  return headers
    .map(header => header.trim().toLowerCase())
    .sort()
    .join('|');
};

/**
 * Merge multiple tables with similar headers
 */
export const mergeTables = (tables: any[], fileName: string): any => {
  // Use the headers from the first table
  const headers = tables[0].headers;
  
  // Combine all rows from all tables
  const allRows: string[][] = [];
  const pageNumbers: number[] = [];
  
  tables.forEach(table => {
    allRows.push(...table.rows);
    if (table.pageNumber) {
      pageNumbers.push(table.pageNumber);
    }
  });
  
  // Sort page numbers for the title
  pageNumbers.sort((a, b) => a - b);
  const pageRangeStr = pageNumbers.length > 0 
    ? `(Pages ${pageNumbers[0]}-${pageNumbers[pageNumbers.length - 1]})`
    : '';
  
  return {
    tableId: `pdf-merged-table-${Date.now()}`,
    source: fileName,
    title: `Table from ${fileName} ${pageRangeStr}`,
    headers: headers,
    rows: allRows,
    confidence: 0.85,
    mergedFromPages: pageNumbers
  };
};

/**
 * Consolidate tables extracted from multiple pages
 */
export const consolidateTables = (tables: any[], fileName: string): any[] => {
  if (!tables || tables.length <= 1) {
    return tables;
  }
  
  console.log(`Consolidating ${tables.length} tables extracted from PDF`);
  
  // Group tables by similar headers
  const tableGroups: Record<string, any[]> = {};
  
  tables.forEach(table => {
    if (!table.headers || !table.rows) return;
    
    // Create a signature for the table based on headers
    const headerSignature = createHeaderSignature(table.headers);
    
    if (!tableGroups[headerSignature]) {
      tableGroups[headerSignature] = [];
    }
    
    tableGroups[headerSignature].push(table);
  });
  
  // Merge tables with similar headers
  const consolidatedTables: any[] = [];
  
  Object.keys(tableGroups).forEach(signature => {
    const tablesInGroup = tableGroups[signature];
    
    if (tablesInGroup.length === 1) {
      // Only one table with this header signature, no need to merge
      consolidatedTables.push(tablesInGroup[0]);
    } else {
      // Multiple tables with same headers, merge them
      const mergedTable = mergeTables(tablesInGroup, fileName);
      consolidatedTables.push(mergedTable);
    }
  });
  
  console.log(`Consolidated ${tables.length} tables into ${consolidatedTables.length} tables`);
  return consolidatedTables;
};
