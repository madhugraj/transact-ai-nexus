
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Mic, 
  Send, 
  Volume, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Sample suggested queries
const suggestedQueries = [
  "Show unmatched invoices",
  "Generate GRN for last invoice",
  "Summarize pending approvals",
  "Check discrepancies in recent invoices",
  "Compare vendor spending Q1 vs Q2"
];

// Sample conversation for demo
const initialMessages = [
  {
    id: '1',
    role: 'system',
    content: "Welcome to the Transaction Agent AI Assistant. How can I help you today?",
    timestamp: new Date(Date.now() - 60000 * 10)
  }
];

const AIAssistant = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Handle sending a message
  const handleSendMessage = (content?: string) => {
    const messageContent = content || input;
    if (!messageContent.trim()) return;
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    
    // Simulate AI thinking
    setIsTyping(true);
    setTimeout(() => {
      let responseContent = "";
      
      // Generate different responses based on message content
      if (messageContent.toLowerCase().includes("unmatched")) {
        responseContent = "I found 3 unmatched invoices from the past week:\n\n1. INV-2023-045 from ABC Corp ($1,240)\n2. INV-2023-048 from Tech Solutions ($3,650)\n3. INV-2023-051 from Office Supplies Ltd. ($845)\n\nWould you like me to attempt matching these with available POs?";
      } else if (messageContent.toLowerCase().includes("grn")) {
        responseContent = "I've generated a Goods Receipt Note for Invoice INV-2023-042 received yesterday. It's been linked to PO-2023-065 and is ready for review. Would you like to see the details or submit it to the ERP system?";
      } else if (messageContent.toLowerCase().includes("pending") || messageContent.toLowerCase().includes("approval")) {
        responseContent = "There are 5 items awaiting approval:\n\n- 3 invoices (total value: $12,540)\n- 1 purchase order ($8,750)\n- 1 payment authorization ($4,200)\n\nThe oldest item has been pending for 3 days. Would you like me to send reminders to the approvers?";
      } else if (messageContent.toLowerCase().includes("discrepancy")) {
        responseContent = "I've detected discrepancies in 2 recent invoices:\n\n1. INV-2023-047: Amount mismatch with PO ($1,240 vs $1,340)\n2. INV-2023-049: Missing line items compared to delivery receipt\n\nWould you like me to highlight these to the vendor or create exception reports?";
      } else if (messageContent.toLowerCase().includes("compare") || messageContent.toLowerCase().includes("spending")) {
        responseContent = "Comparing vendor spending between Q1 and Q2 2023:\n\n- ABC Corp: $34,500 in Q1, $42,700 in Q2 (+23.8%)\n- Tech Solutions: $28,900 in Q1, $25,400 in Q2 (-12.1%)\n- Office Supplies Ltd.: $5,200 in Q1, $6,800 in Q2 (+30.8%)\n\nOverall spending increased by 10.3% quarter-over-quarter. Would you like me to generate a detailed report?";
      } else {
        responseContent = "I'll help you with that request. Based on the transaction data, I can see that we have processed 127 documents this month with a total value of $245,890. There are currently 12 pending approvals and 3 invoices with detected discrepancies. Would you like me to elaborate on any of these areas?";
      }
      
      // Add AI response
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: responseContent,
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };
  
  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div>
        <h1 className="text-2xl font-semibold mb-2">AI Assistant</h1>
        <p className="text-muted-foreground">
          Get answers, analyze data, and automate tasks with your transaction assistant
        </p>
      </div>
      
      <div className="mt-6 flex-1 flex flex-col">
        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="explain">Explanations</TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="flex-1 flex flex-col mt-0 pt-6">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Transaction Assistant
                  <Badge variant="outline" className="ml-2 bg-primary/10 text-primary text-xs">AI Powered</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex flex-col max-w-[80%] rounded-lg p-3",
                        message.role === 'user'
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <span
                        className={cn(
                          "text-xs mt-1",
                          message.role === 'user'
                            ? "text-primary-foreground/70 text-right"
                            : "text-muted-foreground"
                        )}
                      >
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex max-w-[80%] rounded-lg p-3 bg-muted">
                      <div className="flex space-x-1 items-center">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {suggestedQueries.map((query) => (
                      <Button
                        key={query}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleSendMessage(query)}
                      >
                        {query}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="relative">
                    <Input
                      ref={inputRef}
                      placeholder="Ask a question..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pr-24"
                    />
                    <div className="absolute right-2 top-2 flex space-x-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6">
                        <Mic className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                      >
                        <Volume className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleSendMessage()}
                        disabled={!input.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="explain" className="flex-1 flex flex-col mt-0 pt-6">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  AI Explanations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>
                    This panel provides detailed explanations of how the AI is processing your transactions. Select a recent transaction to see the reasoning behind the analysis.
                  </p>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Analysis for Invoice INV-2023-042</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Invoice has been processed with 92% confidence
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium">Document Classification</h4>
                        <p className="text-sm text-muted-foreground">
                          Detected as invoice based on format, presence of invoice number, and vendor details with 99% confidence.
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Data Extraction</h4>
                        <p className="text-sm text-muted-foreground">
                          Successfully extracted vendor (ABC Corp), amount ($1,240.56), and line items (3) with 95% confidence.
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">PO Matching</h4>
                        <p className="text-sm text-muted-foreground">
                          Matched to PO-2023-065 based on vendor ID, reference number, and line item comparison. Match confidence: 92%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="help" className="flex-1 flex flex-col mt-0 pt-6">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2" />
                  Assistant Help
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>
                    The AI Assistant helps you manage and process transactions more efficiently. Here are some things you can ask:
                  </p>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Example questions:</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>"Show all invoices pending approval"</li>
                      <li>"Find discrepancies in recent transactions"</li>
                      <li>"Generate a GRN for invoice #INV-2023-042"</li>
                      <li>"Summarize spending by vendor for Q2"</li>
                      <li>"Check if we have any duplicate invoices"</li>
                      <li>"Show me invoices with missing PO references"</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Assistant capabilities:</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 border rounded-md">
                        <h4 className="text-sm font-medium">Transaction Analysis</h4>
                        <p className="text-xs text-muted-foreground">
                          Review and analyze financial documents
                        </p>
                      </div>
                      <div className="p-3 border rounded-md">
                        <h4 className="text-sm font-medium">Approvals Management</h4>
                        <p className="text-xs text-muted-foreground">
                          Track and process document approvals
                        </p>
                      </div>
                      <div className="p-3 border rounded-md">
                        <h4 className="text-sm font-medium">Discrepancy Detection</h4>
                        <p className="text-xs text-muted-foreground">
                          Find and highlight inconsistencies
                        </p>
                      </div>
                      <div className="p-3 border rounded-md">
                        <h4 className="text-sm font-medium">Data Visualization</h4>
                        <p className="text-xs text-muted-foreground">
                          Generate reports and summaries
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIAssistant;
