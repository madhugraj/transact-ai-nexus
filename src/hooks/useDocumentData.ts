
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Document } from '@/components/assistant/DocumentSelector.d';
import { getProcessedDocuments } from '@/utils/documentStorage';
import { supabase } from '@/integrations/supabase/client';
import { formatTableData, ensureStringArray, ensure2DArray } from '@/utils/documentHelpers';

/**
 * Hook for managing document data loading and selection
 */
export const useDocumentData = () => {
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [processedDocuments, setProcessedDocuments] = useState<Document[]>([]);
  const { toast } = useToast();
  
  // Load documents from all sources
  const fetchProcessedDocuments = async () => {
    setIsLoadingDocuments(true);
    try {
      console.log("Fetching processed documents...");
      
      // First try to get from Supabase directly for latest data
      let supabaseTables: Document[] = [];
      try {
        const { data: tables, error } = await supabase
          .from('extracted_tables')
          .select(`
            id,
            title,
            headers,
            rows,
            created_at,
            confidence,
            file_id,
            uploaded_files (name, file_type)
          `)
          .order('created_at', { ascending: false });
          
        if (!error && tables && tables.length > 0) {
          console.log(`Retrieved ${tables.length} tables from Supabase directly`, tables);
          
          supabaseTables = tables.map((table: any) => formatTableData(table, 'supabase'));
          
          // Set processed documents immediately from Supabase
          if (supabaseTables.length > 0) {
            setProcessedDocuments(supabaseTables);
          }
        }
      } catch (e) {
        console.error("Error directly querying Supabase tables:", e);
      }
      
      // If we couldn't get from Supabase, get from utility function (includes local storage)
      if (supabaseTables.length === 0) {
        const docs = await getProcessedDocuments();
        console.log(`Fetched ${docs.length} processed documents from utilities`);
        
        if (docs.length > 0) {
          setProcessedDocuments(docs);
        }
      }
    } catch (error) {
      console.error("Error fetching processed documents:", error);
      toast({
        title: "Error loading documents",
        description: "Could not load processed documents. Try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Get document data by ID
  const getDocumentDataById = async (documentId: string) => {
    try {
      console.log('Getting document data for ID:', documentId);
      
      // First try to get document from already loaded documents
      const preloadedDoc = processedDocuments.find(doc => doc.id === documentId);
      if (preloadedDoc) {
        console.log("Using pre-loaded document data:", preloadedDoc);
        return preloadedDoc;
      }
      
      // Try direct Supabase query for UUID table data
      if (documentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        try {
          const { data: table, error } = await supabase
            .from('extracted_tables')
            .select('id, title, headers, rows, confidence, created_at')
            .eq('id', documentId)
            .single();
            
          if (!error && table) {
            return {
              id: table.id,
              name: table.title || 'Extracted Table',
              type: 'table' as const,
              extractedAt: table.created_at,
              source: 'supabase' as const,
              headers: ensureStringArray(table.headers),
              rows: ensure2DArray(table.rows),
              confidence: table.confidence
            };
          }
        } catch (e) {
          console.error("Error in direct Supabase query:", e);
        }
      }
      
      // Special case for local documents and tables
      const localStorageDocs = JSON.parse(localStorage.getItem('processedTables') || '[]');
      const localStorageFiles = JSON.parse(localStorage.getItem('processedFiles') || '[]');
      
      // Check in local storage
      const localDoc = [
        ...localStorageDocs.filter((doc: any) => doc !== null),
        ...localStorageFiles.filter((file: any) => file !== null)
      ].find((doc: any) => doc.id === documentId || doc.backendId === documentId);
      
      if (localDoc) {
        return {
          id: localDoc.id || `doc-${Date.now()}`,
          name: localDoc.name || localDoc.title || 'Document',
          type: localDoc.type || (localDoc.headers && localDoc.rows ? 'table' : 'document'),
          extractedAt: localDoc.extractedAt || new Date().toISOString(),
          source: (localDoc.source === 'supabase' ? 'supabase' : 'local') as 'local' | 'supabase',
          headers: ensureStringArray(localDoc.headers),
          rows: ensure2DArray(localDoc.rows),
          confidence: localDoc.confidence || 0
        } as Document;
      }
      
      console.log("Document not found:", documentId);
      return null;
    } catch (error) {
      console.error("Error retrieving document data:", error);
      return null;
    }
  };

  // Handle document selection
  const handleDocumentChange = async (documentId: string) => {
    setSelectedDocument(documentId);
    
    // Update document list if needed
    const documentFound = processedDocuments.some(doc => doc.id === documentId);
    if (!documentFound) {
      const docData = await getDocumentDataById(documentId);
      if (docData) {
        // Use type assertion to ensure the docData is a valid Document
        setProcessedDocuments(prev => [...prev, docData as Document]);
      }
    }
    
    return documentId;
  };
  
  // Load documents on mount
  useEffect(() => {
    fetchProcessedDocuments();
    
    // Set up event listener for document processing events
    const handleDocumentProcessed = () => {
      console.log("Document processed event received, refreshing documents list");
      fetchProcessedDocuments();
    };
    
    window.addEventListener('documentProcessed', handleDocumentProcessed);
    
    // Poll every 15 seconds to make sure we catch any updates
    const intervalId = setInterval(fetchProcessedDocuments, 15000);
    
    return () => {
      window.removeEventListener('documentProcessed', handleDocumentProcessed);
      clearInterval(intervalId);
    };
  }, []);

  return {
    isLoadingDocuments,
    selectedDocument,
    processedDocuments,
    handleDocumentChange,
    getDocumentDataById,
    fetchProcessedDocuments
  };
};
