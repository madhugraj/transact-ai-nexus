
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/components/assistant/MessageList';
import { Document } from '@/components/assistant/DocumentSelector';
import { getProcessedDocuments, getDocumentDataById } from '@/utils/documentStorage';
import { generateInsightsWithGemini } from '@/services/api/gemini/insightGenerator';
import { getExtractedTables, getTableById } from '@/services/supabaseService';
import { useSearchParams } from 'react-router-dom';

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
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [processedDocuments, setProcessedDocuments] = useState<Document[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // Load processed documents from localStorage and Supabase
  useEffect(() => {
    const fetchProcessedDocuments = async () => {
      try {
        console.log("Fetching processed documents...");
        const docs = await getProcessedDocuments();
        console.log(`Fetched ${docs.length} processed documents`);
        setProcessedDocuments(docs);
        
        if (docs.length === 0) {
          console.log("No documents found. Checking sources:");
          console.log("localStorage - processedTables:", localStorage.getItem('processedTables'));
          console.log("localStorage - processedFiles:", localStorage.getItem('processedFiles'));
          
          // Try fetching directly from Supabase
          try {
            const tables = await getExtractedTables();
            console.log("Supabase tables:", tables);
            
            if (tables.length > 0) {
              const formattedTables = tables.map(table => ({
                id: table.id,
                name: table.title || 'Extracted Table',
                type: 'table',
                extractedAt: table.created_at
              }));
              setProcessedDocuments(formattedTables);
            }
          } catch (error) {
            console.error("Error fetching from Supabase:", error);
          }
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
        // First try from Supabase if it looks like a UUID
        if (selectedDocument.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          documentData = await getTableById(selectedDocument);
        }
        
        // If not found in Supabase, try localStorage
        if (!documentData) {
          documentData = await getDocumentDataById(selectedDocument);
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
        const tableData = await getTableById(value);
        if (tableData) {
          doc = {
            id: tableData.id,
            name: tableData.title,
            type: 'table',
            extractedAt: tableData.created_at
          };
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
    selectedDocument,
    processedDocuments,
    handleSendMessage,
    handleDocumentChange,
    addSystemMessage
  };
};

export default useAIAssistant;
