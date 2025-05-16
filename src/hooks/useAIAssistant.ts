
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/components/assistant/MessageList';
import { Document } from '@/components/assistant/DocumentSelector';
import { getProcessedDocuments, getDocumentDataById } from '@/utils/documentStorage';
import { generateInsightsWithGemini } from '@/services/api/gemini/insightGenerator';

// Extend the Message type to include 'system' as a valid sender type
// This augmentation is necessary since we can't modify the original Message interface
declare module '@/components/assistant/MessageList' {
  interface Message {
    sender: 'user' | 'assistant' | 'system';
  }
}

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

  // Load real processed documents from localStorage
  useEffect(() => {
    const fetchProcessedDocuments = () => {
      try {
        console.log("Fetching processed documents...");
        const docs = getProcessedDocuments();
        console.log(`Fetched ${docs.length} processed documents`);
        setProcessedDocuments(docs);
        
        if (docs.length === 0) {
          console.log("No documents found. Checking localStorage directly:");
          console.log("processedTables:", localStorage.getItem('processedTables'));
          console.log("processedFiles:", localStorage.getItem('processedFiles'));
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

  // Add a system message to the chat
  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: `system-${Date.now()}`,
      content,
      sender: 'system', // This is now valid with our module augmentation
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
    const documentData = selectedDocument ? getDocumentDataById(selectedDocument) : null;
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
          const headers = documentData.headers.join(' | ');
          const rows = documentData.rows.map(row => row.join(' | ')).join('\n');
          tableContext = `Table: ${documentData.name || doc?.name || 'Unknown'}\n\nHeaders: ${headers}\n\nData:\n${rows}`;
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

  const handleDocumentChange = (value: string) => {
    setSelectedDocument(value);
    
    const doc = processedDocuments.find(d => d.id === value);
    
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
