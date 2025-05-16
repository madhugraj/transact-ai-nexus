
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, InfoIcon, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  handleSendMessage: () => void;
  isProcessing: boolean;
  hasDocuments?: boolean;
  isDocumentSelected?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  message, 
  setMessage, 
  handleSendMessage, 
  isProcessing,
  hasDocuments = true,
  isDocumentSelected = false
}) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Show different tooltips based on state
  const tooltipContent = !hasDocuments 
    ? "Process documents in the Documents section first to use the AI Assistant"
    : !isDocumentSelected
    ? "Select a document from the dropdown above to ask questions about it"
    : "Ask analytical questions about the selected document";

  const tooltipIcon = !hasDocuments || !isDocumentSelected
    ? <AlertCircle className="h-4 w-4 text-amber-500" />
    : <InfoIcon className="h-4 w-4 text-muted-foreground" />;

  return (
    <div className="w-full flex gap-2">
      <div className="relative w-full">
        <Textarea
          placeholder={
            !hasDocuments 
              ? "Process documents first to use the AI Assistant..." 
              : !isDocumentSelected
              ? "Select a document above before asking questions..."
              : "Ask a question about your processed documents..."
          }
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          className="resize-none pr-10"
          rows={1}
          maxLength={500}
          disabled={isProcessing || !hasDocuments || !isDocumentSelected}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="absolute right-2 top-1/2 -translate-y-1/2">
                {tooltipIcon}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm max-w-[250px]">
                {tooltipContent}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Button 
        onClick={handleSendMessage} 
        disabled={!message.trim() || isProcessing || !hasDocuments || !isDocumentSelected}
        size="icon"
        className="shrink-0"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default MessageInput;
