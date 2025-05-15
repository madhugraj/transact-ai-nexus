
import { Document } from "@/components/assistant/DocumentSelector";

/**
 * Utility functions for storing and retrieving processed documents from localStorage
 */

/**
 * Save processed files to localStorage
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
 * Save processed tables to localStorage
 */
export const saveProcessedTables = (tables: any[], processingId?: string) => {
  try {
    if (!tables || tables.length === 0) {
      console.log("No tables provided to save");
      return false;
    }
    
    console.log("Saving tables to localStorage:", tables);
    
    // Get existing processed tables or initialize empty array
    const existingTables = localStorage.getItem('processedTables');
    const processedTables = existingTables ? JSON.parse(existingTables) : [];
    
    // Add newly processed tables with timestamp
    const newProcessedTables = Array.isArray(tables) 
      ? tables.map((table: any) => ({
          ...table,
          id: table.id || `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: table.name || table.title || 'Extracted Table',
          type: 'table', // Ensure type is set for document selector
          extractedAt: new Date().toISOString(),
          processingId
        }))
      : [{
          ...(tables as any),
          id: (tables as any).id || `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: (tables as any).name || (tables as any).title || 'Extracted Table',
          type: 'table', // Ensure type is set for document selector
          extractedAt: new Date().toISOString(),
          processingId
        }];
    
    // Update localStorage with combined array
    localStorage.setItem('processedTables', JSON.stringify([...processedTables, ...newProcessedTables]));
    
    // Dispatch event to notify components that new tables are processed
    window.dispatchEvent(new CustomEvent('documentProcessed'));
    
    console.log('Saved processed tables to localStorage:', newProcessedTables);
    return true;
  } catch (error) {
    console.error("Error saving processed tables to localStorage:", error);
    return false;
  }
};

/**
 * Get all processed documents from localStorage
 */
export const getProcessedDocuments = (): Document[] => {
  try {
    // Try to get processed documents from localStorage
    const processedTablesStr = localStorage.getItem('processedTables');
    const processedFilesStr = localStorage.getItem('processedFiles');
    
    console.log('Raw localStorage data for documents:', { 
      processedTablesStr: processedTablesStr ? `${processedTablesStr.substring(0, 100)}...` : 'null', 
      processedFilesStr: processedFilesStr ? `${processedFilesStr.substring(0, 100)}...` : 'null'
    });
    
    const tables = processedTablesStr ? JSON.parse(processedTablesStr) : [];
    const files = processedFilesStr ? JSON.parse(processedFilesStr) : [];
    
    console.log('Parsed localStorage data:', {
      tablesCount: tables.length,
      filesCount: files.length,
      tablesSample: tables.length > 0 ? tables[0].name : 'No tables',
      filesSample: files.length > 0 ? files[0].name : 'No files'
    });
    
    // Create properly formatted Document objects for the selector
    const docs: Document[] = [
      ...tables.filter((table: any) => table !== null).map((table: any) => ({
        id: table.id || `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: table.name || table.title || 'Extracted Table',
        type: table.type || 'table',
        extractedAt: table.extractedAt || new Date().toISOString()
      })),
      ...files.filter((file: any) => file !== null).map((file: any) => ({
        id: file.id || file.backendId || `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name || (file.file && file.file.name) || 'Processed Document',
        type: file.file && file.file.type && file.file.type.includes('image') ? 'image' : 'document',
        extractedAt: file.extractedAt || new Date().toISOString()
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
 * Get document data by ID
 */
export const getDocumentDataById = (documentId: string) => {
  try {
    console.log('Getting document data for ID:', documentId);
    
    const tablesStr = localStorage.getItem('processedTables');
    const filesStr = localStorage.getItem('processedFiles');
    
    const tables = tablesStr ? JSON.parse(tablesStr) : [];
    const files = filesStr ? JSON.parse(filesStr) : [];
    
    const selectedTable = tables.find((t: any) => t.id === documentId);
    const selectedFile = files.find((f: any) => f.id === documentId || f.backendId === documentId);
    
    const result = selectedTable || selectedFile || null;
    console.log('Found document data:', result ? 'Document found' : 'Document not found');
    
    return result;
  } catch (error) {
    console.error("Error retrieving document data:", error);
    return null;
  }
};
