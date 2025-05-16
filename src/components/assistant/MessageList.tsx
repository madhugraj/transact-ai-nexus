
import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: Date;
}

interface MessageListProps {
  messages: Message[];
  isProcessing: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isProcessing }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
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
                  : msg.sender === 'system'
                  ? "bg-muted/60 italic text-muted-foreground text-xs"
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
  );
};

export default MessageList;
