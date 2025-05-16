
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import DocumentSelector from './DocumentSelector';
import useAIAssistant from '@/hooks/useAIAssistant';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getDocumentDataById } from '@/utils/documentStorage';

interface AIAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDocument?: string;
  initialPrompt?: string;
}

const AIAssistantDialog: React.FC<AIAssistantDialogProps> = ({ 
  open, 
  onOpenChange,
  initialDocument,
  initialPrompt
}) => {
  const {
    message,
    setMessage,
    messages,
    isProcessing,
    processedDocuments,
    handleSendMessage,
    handleDocumentChange,
    addSystemMessage
  } = useAIAssistant();
  
  const { toast } = useToast();

  // Initialize with the provided document and prompt if available
  useEffect(() => {
    if (open) {
      if (initialDocument) {
        console.log("Setting initial document:", initialDocument);
        
        // Check if document data exists
        const documentData = getDocumentDataById(initialDocument);
        if (documentData) {
          console.log("Document data found:", documentData);
          handleDocumentChange(initialDocument);
        } else {
          console.warn("Document data not found for ID:", initialDocument);
          toast({
            title: "Document not found",
            description: "The selected document data could not be loaded",
            variant: "destructive",
          });
        }
      }
      
      if (initialPrompt && initialPrompt.trim() !== '') {
        console.log("Setting initial prompt:", initialPrompt);
        setMessage(initialPrompt);
        
        // Add a system message indicating a custom prompt was loaded
        addSystemMessage(`Custom prompt loaded: "${initialPrompt}"`);
      }
    }
  }, [open, initialDocument, initialPrompt, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
          <DialogTitle className="text-lg flex items-center justify-between w-full">
            <div className="flex items-center">
              Document AI Assistant
            </div>
            <div className="flex items-center gap-2">
              <DocumentSelector 
                documents={processedDocuments} 
                onDocumentChange={handleDocumentChange} 
                selectedDocumentId={initialDocument}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-grow overflow-hidden flex flex-col">
          <div className="flex-grow overflow-auto p-0">
            <MessageList messages={messages} isProcessing={isProcessing} />
          </div>
          
          <div className="p-4 border-t">
            <MessageInput 
              message={message}
              setMessage={setMessage}
              handleSendMessage={handleSendMessage}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIAssistantDialog;
