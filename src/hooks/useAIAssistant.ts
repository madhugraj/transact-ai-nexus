import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/components/assistant/MessageList';
import { useSearchParams } from 'react-router-dom';
import { useDocumentData } from '@/hooks/useDocumentData';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { Document } from '@/components/assistant/DocumentSelector.d';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // Document data management
  const {
    isLoadingDocuments,
    selectedDocument,
    processedDocuments,
    handleDocumentChange,
    getDocumentDataById
  } = useDocumentData();

  // AI generation capabilities
  const {
    isProcessing,
    isGeminiConfigured,
    generateAIResponse,
    generateDocumentWelcomeMessage
  } = useAIGeneration();

  // Check URL parameters for auto-selecting a document
  useEffect(() => {
    const tableId = searchParams.get('tableId');
    const docId = searchParams.get('docId');
    
    if (tableId || docId) {
      const documentId = tableId || docId;
      console.log("Auto-selecting document from URL params:", documentId);
      
      // Fetch and load the document data
      if (documentId) {
        handleDocumentChange(documentId).then(() => {
          // Add welcome message only after document is loaded
          const doc = processedDocuments.find(d => d.id === documentId);
          if (doc) {
            setMessages(prev => [...prev, generateDocumentWelcomeMessage(doc)]);
          }
        });
      }
      
      // Remove the parameter after processing to avoid reloading the selection
      searchParams.delete('tableId');
      searchParams.delete('docId');
      setSearchParams(searchParams);
    }
  }, [searchParams, processedDocuments.length]);

  // When document changes, add welcome message
  useEffect(() => {
    if (selectedDocument) {
      const doc = processedDocuments.find(d => d.id === selectedDocument);
      if (doc) {
        setMessages(prev => {
          // Check if we already have a welcome message for this document
          const hasWelcomeMessage = prev.some(
            msg => msg.sender === 'assistant' && 
                  msg.content.includes(`I've loaded "${doc.name}"`)
          );
          
          if (!hasWelcomeMessage) {
            return [...prev, generateDocumentWelcomeMessage(doc)];
          }
          return prev;
        });
      }
    }
  }, [selectedDocument]);

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
    setMessage('');

    try {
      // Get document data if available
      let documentData = null;
      let documentInfo = null;
      
      if (selectedDocument) {
        documentData = await getDocumentDataById(selectedDocument);
        documentInfo = processedDocuments.find(d => d.id === selectedDocument);
      }
      
      // Generate AI response
      const response = await generateAIResponse(
        message, 
        documentData, 
        documentInfo?.name
      );

      // Add AI response message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Show error toast if there was an error
      if (response.error) {
        toast({
          title: "Processing error",
          description: response.error,
          variant: "destructive"
        });
      }
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
    isGeminiConfigured,
    handleSendMessage,
    handleDocumentChange,
    addSystemMessage
  };
};

export default useAIAssistant;
