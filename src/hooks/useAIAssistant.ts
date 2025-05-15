
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/components/assistant/MessageList';
import { Document } from '@/components/assistant/DocumentSelector';
import { getProcessedDocuments, getDocumentDataById } from '@/utils/documentStorage';

export const useAIAssistant = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I am your AI assistant. I can help you analyze documents and tables that have been processed in the system. How can I help you today?',
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

  const handleSendMessage = () => {
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

    // Simulate AI processing
    setTimeout(() => {
      let responseContent = '';
      
      // Get document data if possible
      const documentData = selectedDocument ? getDocumentDataById(selectedDocument) : null;

      // Generate different responses based on document selection and query
      if (selectedDocument) {
        const doc = processedDocuments.find(d => d.id === selectedDocument);
        
        if (documentData) {
          // Use actual data if available
          if (message.toLowerCase().includes('total') || message.toLowerCase().includes('sum')) {
            responseContent = `Based on the ${doc?.type} "${doc?.name}", I've analyzed the data and found several numeric values. If you're looking for a specific total, please clarify which column or field you're interested in.`;
          } else if (message.toLowerCase().includes('date') || message.toLowerCase().includes('when')) {
            responseContent = `The ${doc?.type} "${doc?.name}" was processed on ${doc?.extractedAt || new Date().toLocaleString()}. For specific dates within the document, please ask about a particular field.`;
          } else {
            responseContent = `I've analyzed the ${doc?.type} "${doc?.name}" and found ${documentData.data ? documentData.data.length + ' records' : 'the following information'}. You can ask specific questions about the content, such as totals, dates, or specific entries.`;
          }
        } else {
          // Use generic responses if no data is available
          if (message.toLowerCase().includes('total') || message.toLowerCase().includes('sum')) {
            responseContent = `Based on the ${doc?.type} "${doc?.name}", the total amount is $12,450.75.`;
          } else if (message.toLowerCase().includes('date') || message.toLowerCase().includes('when')) {
            responseContent = `The ${doc?.type} "${doc?.name}" is dated May 15, 2023.`;
          } else if (message.toLowerCase().includes('who') || message.toLowerCase().includes('vendor')) {
            responseContent = `The vendor mentioned in ${doc?.name} is ABC Corporation.`;
          } else {
            responseContent = `I've analyzed the ${doc?.type} "${doc?.name}" and found the following information: This is an invoice for IT services rendered in April 2023, with a total of $12,450.75, due by June 15, 2023.`;
          }
        }
      } else {
        if (message.toLowerCase().includes('table') || message.toLowerCase().includes('extract')) {
          responseContent = "I can help analyze your extracted tables. Please select a document from the dropdown above, and I'll provide insights about that specific data.";
        } else if (message.toLowerCase().includes('how') && message.toLowerCase().includes('work')) {
          responseContent = "I work by analyzing the documents and tables you've processed in the system. To get started, select a document from the dropdown above, then ask me specific questions about that data.";
        } else {
          responseContent = "I'm your AI assistant for document analysis. To get the most out of me, please select a processed document from the dropdown above, then ask specific questions about that document.";
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
      setIsProcessing(false);
    }, 1500);
  };

  const handleDocumentChange = (value: string) => {
    setSelectedDocument(value);
    
    const doc = processedDocuments.find(d => d.id === value);
    
    if (doc) {
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: `I've loaded "${doc.name}". What would you like to know about this ${doc.type}?`,
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
