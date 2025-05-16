
import { Document } from "@/components/assistant/DocumentSelector";
import { getExtractedTables, getTableById } from "@/services/supabase/tableService";

/**
 * Get all processed documents from localStorage and Supabase
 */
export const getProcessedDocuments = async (): Promise<Document[]> => {
  try {
    // Try to get processed documents from localStorage
    const processedTablesStr = localStorage.getItem('processedTables');
    const processedFilesStr = localStorage.getItem('processedFiles');
    
    console.log('Raw localStorage data for documents:', { 
      processedTablesStr: processedTablesStr ? `${processedTablesStr.substring(0, 100)}...` : 'null', 
      processedFilesStr: processedFilesStr ? `${processedFilesStr.substring(0, 100)}...` : 'null'
    });
    
    const localTables = processedTablesStr ? JSON.parse(processedTablesStr) : [];
    const localFiles = processedFilesStr ? JSON.parse(processedFilesStr) : [];
    
    // Try to get documents from Supabase
    let supabaseTables: any[] = [];
    
    try {
      const tablesData = await getExtractedTables();
      supabaseTables = tablesData.map((table: any) => ({
        id: table.id,
        name: table.title,
        type: 'table',
        extractedAt: table.created_at,
        confidence: table.confidence,
        source: 'supabase'
      }));
    } catch (e) {
      console.error("Error fetching tables from Supabase:", e);
    }
    
    // Combine tables from both sources, prioritizing Supabase
    const combinedTables = [
      ...supabaseTables,
      ...localTables.filter((table: any) => 
        table !== null && 
        !supabaseTables.some((sTable: any) => sTable.id === table.id)
      )
    ];
    
    // Create properly formatted Document objects for the selector
    const docs: Document[] = [
      ...combinedTables.map((table: any) => ({
        id: table.id || `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: table.name || table.title || 'Extracted Table',
        type: table.type || 'table',
        extractedAt: table.extractedAt || table.created_at || new Date().toISOString(),
        source: table.source || 'local'
      })),
      ...localFiles.filter((file: any) => file !== null).map((file: any) => ({
        id: file.id || file.backendId || `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name || (file.file && file.file.name) || 'Processed Document',
        type: file.file && file.file.type && file.file.type.includes('image') ? 'image' : 'document',
        extractedAt: file.extractedAt || new Date().toISOString(),
        source: 'local'
      }))
    ];
    
    console.log('Returning processed documents:', docs);
    return docs;
  } catch (error) {
    console.error("Error getting processed documents:", error);
    return [];
  }
};

/**
 * Get document data by ID from localStorage or Supabase
 */
export const getDocumentDataById = async (documentId: string) => {
  try {
    console.log('Getting document data for ID:', documentId);
    
    // First try Supabase
    if (documentId.includes('table-') || documentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      try {
        const supabaseTable = await getTableById(documentId);
        if (supabaseTable) {
          console.log('Found table in Supabase:', supabaseTable);
          return {
            id: supabaseTable.id,
            name: supabaseTable.title,
            headers: supabaseTable.headers,
            rows: supabaseTable.rows,
            confidence: supabaseTable.confidence,
            extractedAt: supabaseTable.created_at
          };
        }
      } catch (e) {
        console.error("Error getting table from Supabase:", e);
      }
    }
    
    // Fall back to localStorage
    const tablesStr = localStorage.getItem('processedTables');
    const filesStr = localStorage.getItem('processedFiles');
    
    const tables = tablesStr ? JSON.parse(tablesStr) : [];
    const files = filesStr ? JSON.parse(filesStr) : [];
    
    // First check for exact match
    let selectedTable = tables.find((t: any) => t.id === documentId);
    let selectedFile = files.find((f: any) => f.id === documentId || f.backendId === documentId);
    
    // If not found, try to check if the document is a partial ID (when tables are saved with index suffixes)
    if (!selectedTable && documentId.includes('-')) {
      const baseId = documentId.split('-').slice(0, -1).join('-');
      console.log('Trying base ID match:', baseId);
      selectedTable = tables.find((t: any) => t.id.startsWith(baseId));
    }
    
    const result = selectedTable || selectedFile || null;
    console.log('Document data found:', result ? 'Yes' : 'No');
    
    if (result) {
      // Log the data structure to help with debugging
      console.log('Document structure:', {
        id: result.id,
        name: result.name || result.title,
        hasHeaders: Boolean(result.headers),
        hasRows: Boolean(result.rows),
        rowCount: result.rows?.length || 0,
        keys: Object.keys(result)
      });
    }
    
    return result;
  } catch (error) {
    console.error("Error retrieving document data:", error);
    return null;
  }
};

/**
 * Check if a document ID exists in localStorage or Supabase
 */
export const documentExists = async (documentId: string): Promise<boolean> => {
  const result = await getDocumentDataById(documentId);
  return result !== null;
};
