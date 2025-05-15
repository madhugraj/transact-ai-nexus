
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Send, Table as TableIcon, FileText, Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface Document {
  id: string;
  name: string;
  type: 'table' | 'document' | 'image';
  extractedAt: string;
}

const AIAssistant: React.FC = () => {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Mock processed documents
  const processedDocuments: Document[] = [
    { id: '1', name: 'Invoice_ABC_Corp_May2023.pdf', type: 'document', extractedAt: '2023-05-15 14:32' },
    { id: '2', name: 'Quarterly_Sales_Report', type: 'table', extractedAt: '2023-05-14 10:15' },
    { id: '3', name: 'Employee_Expenses_Q2', type: 'table', extractedAt: '2023-05-13 09:45' },
    { id: '4', name: 'Statement_XYZ_April.pdf', type: 'document', extractedAt: '2023-05-12 16:20' },
  ];

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

      // Generate different responses based on document selection and query
      if (selectedDocument) {
        const doc = processedDocuments.find(d => d.id === selectedDocument);
        if (message.toLowerCase().includes('total') || message.toLowerCase().includes('sum')) {
          responseContent = `Based on the ${doc?.type} "${doc?.name}", the total amount is $12,450.75.`;
        } else if (message.toLowerCase().includes('date') || message.toLowerCase().includes('when')) {
          responseContent = `The ${doc?.type} "${doc?.name}" is dated May 15, 2023.`;
        } else if (message.toLowerCase().includes('who') || message.toLowerCase().includes('vendor')) {
          responseContent = `The vendor mentioned in ${doc?.name} is ABC Corporation.`;
        } else {
          responseContent = `I've analyzed the ${doc?.type} "${doc?.name}" and found the following information: This is an invoice for IT services rendered in April 2023, with a total of $12,450.75, due by June 15, 2023.`;
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="border-b px-6 py-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            Document AI Assistant
          </div>
          <Select onValueChange={handleDocumentChange}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select a document" />
            </SelectTrigger>
            <SelectContent>
              {processedDocuments.map((doc) => (
                <SelectItem key={doc.id} value={doc.id}>
                  <div className="flex items-center">
                    {doc.type === 'table' ? (
                      <TableIcon className="h-4 w-4 mr-2 text-blue-500" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                    )}
                    {doc.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 flex-grow overflow-hidden">
        <ScrollArea className="h-[450px] p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-3 text-sm",
                  msg.sender === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {msg.sender === 'assistant' && (
                  <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                    <span className="text-xs">AI</span>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 max-w-[80%]",
                    msg.sender === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.sender === 'user' && (
                  <Avatar className="h-8 w-8 bg-muted">
                    <span className="text-xs">You</span>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />

            {isProcessing && (
              <div className="flex items-center justify-start gap-3 text-sm">
                <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                  <span className="text-xs">AI</span>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
                  <div className="flex space-x-1 items-center h-6">
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-4 border-t pt-4">
        <div className="w-full flex gap-2">
          <Textarea
            placeholder="Ask a question about your processed documents..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="resize-none"
            rows={1}
            maxLength={500}
            disabled={isProcessing}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!message.trim() || isProcessing}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AIAssistant;
