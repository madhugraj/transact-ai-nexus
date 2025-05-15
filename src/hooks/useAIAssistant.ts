
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/components/assistant/MessageList';
import { Document } from '@/components/assistant/DocumentSelector';
import { getProcessedDocuments, getDocumentDataById } from '@/utils/documentStorage';
import { generateInsightsWithGemini } from '@/services/api/gemini/insightGenerator';

// Business analyst prompt template
const BUSINESS_ANALYST_PROMPT = `You are a business data analyst. Given the table data and user query, find the answer from the provided table only.

Analyze the output and the original intent to provide a clear explanation and prescriptive business insights.

Instructions:
- Identify patterns, outliers, or anomalies using actual values from the data.
- Explain what the result reveals in business terms.
- Recommend 3–5 specific business actions. Be precise.
- Use professional, clear language.
- Output plain text only. No markdown or code formatting.`;

export const useAIAssistant = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I am your AI business analyst assistant. I can help you analyze documents and tables that have been processed in the system. Ask me specific questions about your data, and I'll provide insights and business recommendations.',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [processedDocuments, setProcessedDocuments] = useState<Document[]>([]);
  const { toast } = useToast();

  // Load processed documents from localStorage
  useEffect(() => {
    const fetchProcessedDocuments = () => {
      try {
        const docs = getProcessedDocuments();
        
        // If no documents found in localStorage, use mock data for demo
        if (docs.length === 0) {
          setProcessedDocuments([
            { id: '1', name: 'Invoice_ABC_Corp_May2023.pdf', type: 'document', extractedAt: '2023-05-15 14:32' },
            { id: '2', name: 'Quarterly_Sales_Report', type: 'table', extractedAt: '2023-05-14 10:15' },
            { id: '3', name: 'Employee_Expenses_Q2', type: 'table', extractedAt: '2023-05-13 09:45' },
            { id: '4', name: 'Statement_XYZ_April.pdf', type: 'document', extractedAt: '2023-05-12 16:20' },
          ]);
        } else {
          setProcessedDocuments(docs);
        }
      } catch (error) {
        console.error("Error fetching processed documents:", error);
        // Fallback to mock data if error occurs
        setProcessedDocuments([
          { id: '1', name: 'Invoice_ABC_Corp_May2023.pdf', type: 'document', extractedAt: '2023-05-15 14:32' },
          { id: '2', name: 'Quarterly_Sales_Report', type: 'table', extractedAt: '2023-05-14 10:15' },
          { id: '3', name: 'Employee_Expenses_Q2', type: 'table', extractedAt: '2023-05-13 09:45' },
          { id: '4', name: 'Statement_XYZ_April.pdf', type: 'document', extractedAt: '2023-05-12 16:20' },
        ]);
      }
    };
    
    fetchProcessedDocuments();
    
    // Set up event listener for document processing
    window.addEventListener('documentProcessed', fetchProcessedDocuments);
    
    return () => {
      window.removeEventListener('documentProcessed', fetchProcessedDocuments);
    };
  }, []);

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
          responseContent = response.data.insights || response.data.summary;
        } else {
          responseContent = `I couldn't analyze this data due to an error: ${response.error || 'Unknown error'}`;
        }
      } else {
        // Generate a default response if no document is selected or no data available
        if (selectedDocument) {
          responseContent = `I'd like to analyze "${doc?.name}" for you, but I don't have access to its data. Please try selecting another document or uploading a document with extractable data.`;
        } else if (message.toLowerCase().includes('table') || message.toLowerCase().includes('extract')) {
          responseContent = "I can help analyze your extracted tables. Please select a document from the dropdown above, and I'll provide insights about that specific data.";
        } else if (message.toLowerCase().includes('how') && message.toLowerCase().includes('work')) {
          responseContent = "I work by analyzing the documents and tables you've processed in the system. To get started, select a document from the dropdown above, then ask me specific questions about that data. I'll provide business insights and recommendations based on the patterns I find.";
        } else {
          responseContent = "I'm your AI business analyst. To get the most out of me, please select a processed document from the dropdown above, then ask specific questions about that document. I'll provide data-driven insights and actionable business recommendations.";
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
    handleDocumentChange
  };
};

export default useAIAssistant;
