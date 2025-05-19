
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/components/assistant/MessageList';
import { Document } from '@/components/assistant/DocumentSelector';
import { getProcessedDocuments, getDocumentDataById } from '@/utils/documentStorage';
import { generateInsightsWithGemini } from '@/services/api/gemini/insightGenerator';
import { supabase } from '@/integrations/supabase/client';

// Business analyst prompt template
const BUSINESS_ANALYST_PROMPT = `You are a business data analyst. Given the table data and user query, find the answer from the provided table only.

Analyze the output and the original intent to provide a clear explanation and prescriptive business insights.

Instructions:
- Identify patterns, outliers, or anomalies using actual values from the data.
- Explain what the result reveals in business terms.
- Recommend 3-5 specific business actions. Be precise.
- Use professional, clear language.
- Output plain text only. No markdown or code formatting.`;

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
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [processedDocuments, setProcessedDocuments] = useState<Document[]>([]);
  const { toast } = useToast();

  // Load processed documents from Supabase and localStorage
  useEffect(() => {
    const fetchProcessedDocuments = async () => {
      try {
        console.log("Fetching processed documents from Supabase and localStorage...");
        
        // First try to fetch from Supabase
        let docs: Document[] = [];
        
        try {
          // Fetch extracted tables
          const { data: extractedTables, error: tableError } = await supabase
            .from('extracted_tables')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (tableError) {
            console.error("Error fetching from extracted_tables:", tableError);
          } else if (extractedTables?.length > 0) {
            console.log(`Fetched ${extractedTables.length} tables from extracted_tables:`, extractedTables);
            
            // Map Supabase data to Document format
            const tableDocs: Document[] = extractedTables.map(table => ({
              id: table.id,
              name: table.title || 'Extracted Table',
              type: 'table' as const,
              extractedAt: table.created_at,
              source: 'supabase' as const,
              data: {
                headers: table.headers,
                rows: table.rows
              }
            }));
            
            docs = [...tableDocs];
          }
          
          // Fetch from extracted_json table
          const { data: extractedJson, error: jsonError } = await supabase
            .from('extracted_json')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (jsonError) {
            console.error("Error fetching from extracted_json:", jsonError);
          } else if (extractedJson?.length > 0) {
            console.log(`Fetched ${extractedJson.length} documents from extracted_json:`, extractedJson);
            
            // Map extracted JSON to Document format - ensure we use file_name properly
            const jsonDocs: Document[] = extractedJson.map(doc => ({
              id: `json_${doc.id}`,
              name: doc.file_name ? removeFileExtension(doc.file_name) : `Document ${doc.id}`,
              type: 'document' as const,
              extractedAt: doc.created_at,
              source: 'supabase' as const,
              data: {
                headers: ["Content"],
                rows: [[JSON.stringify(doc.json_extract)]]
              }
            }));
            
            docs = [...docs, ...jsonDocs];
          }
        } catch (supabaseError) {
          console.error("Failed to fetch from Supabase:", supabaseError);
        }
        
        // Then get localStorage documents as fallback
        const localStorageDocs = getProcessedDocuments();
        console.log(`Fetched ${localStorageDocs.length} documents from localStorage`);
        
        // Combine and deduplicate documents (prioritize Supabase ones)
        const existingIds = new Set(docs.map(d => d.id));
        const uniqueLocalDocs = localStorageDocs.filter(d => !existingIds.has(d.id));
        
        docs = [...docs, ...uniqueLocalDocs];
        
        console.log(`Total unique documents: ${docs.length}`);
        if (docs.length > 0) {
          docs.forEach((doc, index) => {
            console.log(`Document ${index + 1}:`, {
              id: doc.id,
              name: doc.name,
              type: doc.type,
              source: doc.source || 'localStorage'
            });
          });
        }
        
        setProcessedDocuments(docs);
        
        if (docs.length === 0) {
          console.log("No documents found in Supabase or localStorage");
        }
      } catch (error) {
        console.error("Error fetching processed documents:", error);
        toast({
          title: "Error loading documents",
          description: "Could not load processed documents",
          variant: "destructive",
        });
      }
    };
    
    // Helper function to remove file extension - moved inside to ensure it's available
    const removeFileExtension = (fileName: string): string => {
      if (!fileName) return '';
      const lastDotIndex = fileName.lastIndexOf('.');
      return lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
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
    const intervalId = setInterval(fetchProcessedDocuments, 5000);
    
    return () => {
      window.removeEventListener('documentProcessed', handleDocumentProcessed);
      clearInterval(intervalId);
    };
  }, [toast]);

  // Function to get document data, prioritizing Supabase data
  const getDocumentData = async (documentId: string) => {
    // Check if it's a JSON document from extracted_json table
    if (documentId.startsWith('json_')) {
      const realId = documentId.replace('json_', '');
      console.log("Fetching JSON document data:", realId);
      
      try {
        const { data, error } = await supabase
          .from('extracted_json')
          .select('*')
          .eq('id', realId)
          .single();
          
        if (error) {
          console.error("Error fetching document from extracted_json:", error);
          return null;
        }
        
        if (data) {
          return {
            name: data.file_name || `Document ${data.id}`,
            content: data.json_extract,
            type: 'json'
          };
        }
      } catch (error) {
        console.error("Error processing JSON document:", error);
      }
    }
    
    // Check if it's from extracted_tables
    const supabaseDoc = processedDocuments.find(d => d.id === documentId && d.source === 'supabase');
    
    if (supabaseDoc) {
      console.log("Fetching Supabase document data:", documentId);
      
      try {
        const { data, error } = await supabase
          .from('extracted_tables')
          .select('*')
          .eq('id', documentId)
          .single();
          
        if (error) {
          console.error("Error fetching document from Supabase:", error);
          return null;
        }
        
        if (data) {
          return {
            name: data.title,
            headers: data.headers,
            rows: data.rows
          };
        }
      } catch (error) {
        console.error("Error processing Supabase document:", error);
      }
    }
    
    // Fallback to localStorage
    console.log("Fetching localStorage document data:", documentId);
    return getDocumentDataById(documentId);
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
    const documentData = selectedDocument ? await getDocumentData(selectedDocument) : null;
    const doc = processedDocuments.find(d => d.id === selectedDocument);

    console.log("Selected document:", selectedDocument);
    console.log("Document data:", documentData);
    console.log("Found document in processed documents:", doc);

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
            : Object.keys(documentData.headers).join(' | ');
            
          const rows = Array.isArray(documentData.rows) 
            ? documentData.rows.map(row => 
                Array.isArray(row) ? row.join(' | ') : Object.values(row).join(' | ')
              ).join('\n')
            : '';
            
          tableContext = `Table: ${documentData.name || doc?.name || 'Unknown'}\n\nHeaders: ${headers}\n\nData:\n${rows}`;
        } else if (documentData.data && Array.isArray(documentData.data)) {
          // Handle alternative data structure
          tableContext = JSON.stringify(documentData.data, null, 2);
        } else if (typeof documentData === 'object') {
          // Handle any other structure
          tableContext = JSON.stringify(documentData, null, 2);
        }
        
        console.log("Table context prepared:", tableContext.substring(0, 100) + "...");
        
        // Prepare prompt with context and user query
        const analysisPrompt = `${BUSINESS_ANALYST_PROMPT}
        
Table data:
${tableContext}

User query:
${message}`;
        
        console.log("Calling Gemini API with prompt length:", analysisPrompt.length);
        
        // Call Gemini API
        const response = await generateInsightsWithGemini(tableContext, analysisPrompt);
        console.log("Gemini API response:", response);
        
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

  const handleDocumentChange = (value: string) => {
    setSelectedDocument(value);
    console.log("Document selected:", value);
    
    const doc = processedDocuments.find(d => d.id === value);
    console.log("Selected document details:", doc);
    
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
    selectedDocument,
    processedDocuments,
    handleSendMessage,
    handleDocumentChange
  };
};

export default useAIAssistant;
