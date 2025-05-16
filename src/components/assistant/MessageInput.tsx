
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, InfoIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  handleSendMessage: () => void;
  isProcessing: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  message, 
  setMessage, 
  handleSendMessage, 
  isProcessing 
}) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full flex gap-2">
      <div className="relative w-full">
        <Textarea
          placeholder="Ask a question about your processed documents..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          className="resize-none pr-10"
          rows={1}
          maxLength={500}
          disabled={isProcessing}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                <InfoIcon className="h-4 w-4" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm max-w-[250px]">
                First select a document from the dropdown above,
                then ask questions about the data to get insights.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Button 
        onClick={handleSendMessage} 
        disabled={!message.trim() || isProcessing}
        size="icon"
        className="shrink-0"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default MessageInput;
