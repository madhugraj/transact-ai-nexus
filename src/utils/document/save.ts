
/**
 * Save processed files to localStorage and Supabase if connected
 */
export const saveProcessedFiles = (files: any[], processingId?: string) => {
  try {
    // Get existing processed files or initialize empty array
    const existingFiles = localStorage.getItem('processedFiles');
    const processedFiles = existingFiles ? JSON.parse(existingFiles) : [];
    
    // Add newly processed files with timestamp
    const newProcessedFiles = files.map(file => ({
      ...file,
      extractedAt: new Date().toISOString(),
      processingId,
      id: file.id || file.backendId || `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
    
    // Update localStorage with combined array
    localStorage.setItem('processedFiles', JSON.stringify([...processedFiles, ...newProcessedFiles]));
    
    // Dispatch event to notify components that new documents are processed
    window.dispatchEvent(new CustomEvent('documentProcessed'));
    
    console.log('Saved processed files to localStorage:', newProcessedFiles);
    return true;
  } catch (error) {
    console.error("Error saving processed files to localStorage:", error);
    return false;
  }
};

/**
 * Save processed tables to localStorage and Supabase if connected
 */
export const saveProcessedTables = async (tables: any[], processingId?: string) => {
  try {
    if (!tables || tables.length === 0) {
      console.log("No tables provided to save");
      return false;
    }
    
    console.log("Saving tables to localStorage and Supabase:", tables);
    
    // Get existing processed tables or initialize empty array
    const existingTables = localStorage.getItem('processedTables');
    const processedTables = existingTables ? JSON.parse(existingTables) : [];
    
    // Add newly processed tables with timestamp
    const newProcessedTables = Array.isArray(tables) 
      ? tables.map((table: any) => {
          const tableId = table.id || `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          return {
            ...table,
            id: tableId,
            name: table.name || table.title || 'Extracted Table',
            type: 'table', // Ensure type is set for document selector
            extractedAt: new Date().toISOString(),
            processingId
          };
        })
      : [{
          ...(tables as any),
          id: (tables as any).id || `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: (tables as any).name || (tables as any).title || 'Extracted Table',
          type: 'table', // Ensure type is set for document selector
          extractedAt: new Date().toISOString(),
          processingId
        }];
    
    // Log each table to help with debugging
    newProcessedTables.forEach((table, index) => {
      console.log(`Processed table ${index} - ID: ${table.id}, Name: ${table.name}`);
      console.log(`Has headers: ${Boolean(table.headers)}, Row count: ${table.rows?.length || 0}`);
    });
    
    // Update localStorage with combined array
    localStorage.setItem('processedTables', JSON.stringify([...processedTables, ...newProcessedTables]));
    
    // Try to save to Supabase if it exists
    try {
      // This will be handled by the Supabase sync service
      import('@/services/supabase/tableService').then(({ saveExtractedTable }) => {
        for (const table of newProcessedTables) {
          if (table.fileId && table.headers && table.rows) {
            saveExtractedTable(
              table.fileId,
              table.name,
              table.headers,
              table.rows,
              table.confidence || 0.9
            ).catch(e => {
              console.error("Error saving table to Supabase:", e);
            });
          }
        }
      });
    } catch (e) {
      console.error("Error importing Supabase service:", e);
    }
    
    // Dispatch event to notify components that new tables are processed
    window.dispatchEvent(new CustomEvent('documentProcessed'));
    
    console.log('Saved processed tables to localStorage:', newProcessedTables);
    return true;
  } catch (error) {
    console.error("Error saving processed tables to localStorage:", error);
    return false;
  }
};
