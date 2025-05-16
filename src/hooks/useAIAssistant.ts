
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/components/assistant/MessageList';
import { Document } from '@/components/assistant/DocumentSelector';
import { getProcessedDocuments, getDocumentDataById } from '@/utils/documentStorage';
import { generateInsightsWithGemini } from '@/services/api/gemini/insightGenerator';
import { getExtractedTables, getTableById } from '@/services/supabaseService';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Enhanced business analyst prompt template with specific instructions for table analysis
const BUSINESS_ANALYST_PROMPT = `You are a business data analyst. Given the table data and user query, find the answer from the provided table only.

Analyze the output and the original intent to provide a clear explanation and prescriptive business insights.

Instructions:
- Identify patterns, outliers, or anomalies using actual values from the data.
- Perform calculations when appropriate (sums, averages, percentages, growth rates).
- Explain what the result reveals in business terms.
- Recommend 3-5 specific business actions based on the data analysis. Be precise.
- Suggest KPIs or metrics to track going forward.
- Use professional, clear language suitable for business stakeholders.
- Output plain text only. No markdown or code formatting.

Always structure your response with these sections:
1. Summary of findings
2. Key insights (with supporting data points)
3. Business implications
4. Recommended actions`;

export const useAIAssistant = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I am your AI business analyst assistant. I can help you analyze documents and tables that have been processed in the system. Ask me specific questions about your data, and I\'ll provide insights and business recommendations.',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [processedDocuments, setProcessedDocuments] = useState<Document[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // Load processed documents from localStorage and Supabase
  useEffect(() => {
    const fetchProcessedDocuments = async () => {
      setIsLoadingDocuments(true);
      try {
        console.log("Fetching processed documents...");
        
        // First try to get from Supabase directly to ensure we have the latest data
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
            
            supabaseTables = tables.map((table: any) => ({
              id: table.id,
              name: table.title || 'Table from database',
              type: 'table' as const,
              extractedAt: table.created_at,
              source: 'supabase',
              confidence: table.confidence,
              // Pre-load the data to avoid additional calls later
              headers: table.headers,
              rows: table.rows
            }));
            
            // Set processed documents immediately from Supabase
            if (supabaseTables.length > 0) {
              setProcessedDocuments(supabaseTables);
            }
          }
        } catch (e) {
          console.error("Error directly querying Supabase tables:", e);
          // Continue to fallback methods
        }
        
        // If we couldn't get from Supabase directly or want to include locally stored documents
        if (supabaseTables.length === 0) {
          const docs = await getProcessedDocuments();
          console.log(`Fetched ${docs.length} processed documents from utilities`);
          
          if (docs.length > 0) {
            setProcessedDocuments(docs);
          } else {
            console.log("No documents found. Checking alternate sources:");
            
            // Try fetching directly from Supabase again using the utility function
            try {
              const tables = await getExtractedTables();
              console.log("Supabase tables from utility:", tables);
              
              if (tables.length > 0) {
                const formattedTables: Document[] = tables.map(table => ({
                  id: table.id,
                  name: table.title || 'Extracted Table',
                  type: 'table' as const,
                  extractedAt: table.created_at,
                  source: 'supabase'
                }));
                setProcessedDocuments(formattedTables);
              }
            } catch (error) {
              console.error("Error fetching from Supabase via utility:", error);
            }
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
    
    // Fetch immediately on mount
    fetchProcessedDocuments();
    
    // Set up event listener for document processing events
    const handleDocumentProcessed = () => {
      console.log("Document processed event received, refreshing documents list");
      fetchProcessedDocuments();
    };
    
    window.addEventListener('documentProcessed', handleDocumentProcessed);
    
    // Poll every few seconds to make sure we catch any updates
    const intervalId = setInterval(fetchProcessedDocuments, 10000);
    
    return () => {
      window.removeEventListener('documentProcessed', handleDocumentProcessed);
      clearInterval(intervalId);
    };
  }, [toast]);

  // Check URL parameters for auto-selecting a document
  useEffect(() => {
    const tableId = searchParams.get('tableId');
    const docId = searchParams.get('docId');
    
    if (tableId || docId) {
      const documentId = tableId || docId;
      console.log("Auto-selecting document from URL params:", documentId);
      setSelectedDocument(documentId);
      
      // Remove the parameter after processing to avoid reloading the selection
      searchParams.delete('tableId');
      searchParams.delete('docId');
      setSearchParams(searchParams);
      
      // Fetch and load the document data
      if (documentId) {
        handleDocumentChange(documentId);
      }
    }
  }, [searchParams]);

  // Add a system message to the chat
  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: `system-${Date.now()}`,
      content,
      sender: 'system', 
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, systemMessage]);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setMessage('');

    // Get document data if available
    let documentData = null;
    
    try {
      if (selectedDocument) {
        // First check if the document data is already in our processed documents
        const preloadedDoc = processedDocuments.find(doc => doc.id === selectedDocument);
        if (preloadedDoc && preloadedDoc.headers && preloadedDoc.rows) {
          documentData = preloadedDoc;
          console.log("Using pre-loaded document data:", documentData);
        } 
        // If not found in preloaded data, try direct Supabase query for table data
        else if (selectedDocument.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          console.log("Fetching table data directly from Supabase");
          try {
            const { data: table, error } = await supabase
              .from('extracted_tables')
              .select('id, title, headers, rows, confidence, created_at')
              .eq('id', selectedDocument)
              .single();
              
            if (!error && table) {
              documentData = {
                id: table.id,
                name: table.title || 'Extracted Table',
                headers: table.headers,
                rows: table.rows,
                confidence: table.confidence,
                extractedAt: table.created_at
              };
              console.log("Retrieved table data directly from Supabase:", documentData);
            } else {
              console.error("Error fetching table from Supabase:", error);
              // Fall back to utility function
              documentData = await getTableById(selectedDocument);
            }
          } catch (e) {
            console.error("Error in direct Supabase query:", e);
          }
        }
        
        // If still not found, try utility function for localStorage
        if (!documentData) {
          documentData = await getDocumentDataById(selectedDocument);
          console.log("Retrieved document data from utility function:", documentData);
        }
      }
    } catch (error) {
      console.error("Error fetching document data:", error);
    }
    
    const doc = processedDocuments.find(d => d.id === selectedDocument);

    try {
      let responseContent = '';
      
      // If we have a selected document and data, use Gemini API
      if (selectedDocument && documentData) {
        console.log("Processing with Gemini using document data:", documentData);
        
        // Prepare context for Gemini
        let tableContext = '';
        
        if (documentData.headers && documentData.rows) {
          // Format table data as readable text
          const headers = Array.isArray(documentData.headers) 
            ? documentData.headers.join(' | ')
            : Object.values(documentData.headers).join(' | ');
            
          const rows = Array.isArray(documentData.rows)
            ? documentData.rows.map(row => Array.isArray(row) ? row.join(' | ') : Object.values(row).join(' | ')).join('\n')
            : [];
            
          tableContext = `Table: ${documentData.name || documentData.title || doc?.name || 'Unknown'}\n\nHeaders: ${headers}\n\nData:\n${rows}`;
        } else if (documentData.data && Array.isArray(documentData.data)) {
          // Handle alternative data structure
          tableContext = JSON.stringify(documentData.data, null, 2);
        } else if (typeof documentData === 'object') {
          // Handle any other structure
          tableContext = JSON.stringify(documentData, null, 2);
        }
        
        // Prepare prompt with context and user query
        const analysisPrompt = `${BUSINESS_ANALYST_PROMPT}
        
Table data:
${tableContext}

User query:
${message}`;
        
        // Call Gemini API
        const response = await generateInsightsWithGemini(tableContext, analysisPrompt);
        
        if (response.success && response.data) {
          responseContent = response.data.insights || response.data.summary || "I've analyzed the data but don't have specific insights to share.";
        } else {
          responseContent = `I couldn't analyze this data due to an error: ${response.error || 'Unknown error'}`;
        }
      } else {
        // Generate a default response if no document is selected or no data available
        if (selectedDocument) {
          responseContent = `I'd like to analyze "${doc?.name}" for you, but I don't have access to its data. Please try selecting another document or uploading a document with extractable data.`;
        } else {
          responseContent = "Please select a document from the dropdown above to analyze. I need data to work with in order to provide insights. You can upload and process documents in the Documents section.";
        }
      }

      // Add AI response message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error processing message:", error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error while analyzing your data. Please try again with a different query or document.",
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error processing query",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDocumentChange = async (value: string) => {
    setSelectedDocument(value);
    
    let doc = processedDocuments.find(d => d.id === value);
    
    // If document not found in array, try to get it from Supabase
    if (!doc && value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      try {
        // Try direct query first
        const { data: table, error } = await supabase
          .from('extracted_tables')
          .select('id, title, headers, rows, confidence, created_at')
          .eq('id', value)
          .single();
          
        if (!error && table) {
          doc = {
            id: table.id,
            name: table.title || 'Extracted Table',
            type: 'table',
            extractedAt: table.created_at,
            source: 'supabase',
            headers: table.headers,
            rows: table.rows
          };
          
          // Add to processed documents cache
          setProcessedDocuments(prev => [...prev, doc!]);
        } else {
          // Fall back to utility function
          const tableData = await getTableById(value);
          if (tableData) {
            doc = {
              id: tableData.id,
              name: tableData.title,
              type: 'table',
              extractedAt: tableData.created_at,
              source: 'supabase'
            };
          }
        }
      } catch (error) {
        console.error("Error fetching table from Supabase:", error);
      }
    }
    
    if (doc) {
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: `I've loaded "${doc.name}". What would you like to know about this ${doc.type}? I can provide business insights and recommendations based on this data.`,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    }
  };

  return {
    message,
    setMessage,
    messages,
    isProcessing,
    isLoadingDocuments,
    selectedDocument,
    processedDocuments,
    handleSendMessage,
    handleDocumentChange,
    addSystemMessage
  };
};

export default useAIAssistant;
