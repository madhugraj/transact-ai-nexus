
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import DocumentSelector from './DocumentSelector';
import useAIAssistant from '@/hooks/useAIAssistant';

const AIAssistant: React.FC = () => {
  const {
    message,
    setMessage,
    messages,
    isProcessing,
    selectedDocument,
    processedDocuments,
    handleSendMessage,
    handleDocumentChange
  } = useAIAssistant();

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="border-b px-6 py-4 bg-blue-50">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">Z-Intelligent Virtual Auditor</div>
          <DocumentSelector documents={processedDocuments} onDocumentChange={handleDocumentChange} />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 flex-grow overflow-hidden">
        <MessageList messages={messages} isProcessing={isProcessing} />
      </CardContent>
      
      <CardFooter className="p-4 border-t pt-4 bg-white">
        <MessageInput 
          message={message} 
          setMessage={setMessage} 
          handleSendMessage={handleSendMessage} 
          isProcessing={isProcessing} 
          hasDocuments={processedDocuments.length > 0} 
          isDocumentSelected={!!selectedDocument} 
        />
      </CardFooter>
    </Card>
  );
};

export default AIAssistant;
