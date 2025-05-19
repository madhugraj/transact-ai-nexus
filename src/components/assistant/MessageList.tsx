
import React, { useEffect, useRef } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, User } from 'lucide-react';
import StructuredDataDisplay from './StructuredDataDisplay';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  structuredData?: {
    tableData?: {
      headers: string[];
      rows: any[][];
    };
    chartOptions?: {
      type: 'bar' | 'line' | 'pie';
      xKey?: string;
      yKeys?: string[];
      data?: any[];
    };
    rawData?: any;
  };
}

interface MessageListProps {
  messages: Message[];
  isProcessing: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isProcessing }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the most recent message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to render message content with support for basic Markdown
  const renderMessageContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <ScrollArea className="h-[calc(100%-1px)]" ref={scrollAreaRef}>
      <div className="p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <div className="flex items-start gap-3">
                {message.sender === 'assistant' && (
                  <Avatar className="w-8 h-8 border">
                    <Bot className="h-4 w-4" />
                  </Avatar>
                )}
                <div>
                  <div className="text-sm">{renderMessageContent(message.content)}</div>
                  
                  {/* Render structured data if available */}
                  {message.structuredData && (
                    <StructuredDataDisplay data={message.structuredData} />
                  )}
                </div>
                {message.sender === 'user' && (
                  <Avatar className="w-8 h-8 border">
                    <User className="h-4 w-4" />
                  </Avatar>
                )}
              </div>
              <div className="text-xs text-right mt-1 opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="max-w-[85%] p-3 rounded-lg bg-muted">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8 border">
                  <Bot className="h-4 w-4" />
                </Avatar>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[170px]" />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default MessageList;
