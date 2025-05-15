
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import DocumentSelector from './DocumentSelector';
import useAIAssistant from '@/hooks/useAIAssistant';
import { Button } from '@/components/ui/button';
import { Table } from 'lucide-react';
import { saveProcessedTables, clearProcessedDocuments } from '@/utils/documentStorage';

const AIAssistant: React.FC = () => {
  const {
    message,
    setMessage,
    messages,
    isProcessing,
    processedDocuments,
    handleSendMessage,
    handleDocumentChange,
    addSampleTable
  } = useAIAssistant();

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="border-b px-6 py-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            Document AI Assistant
            
            {/* Debug actions for testing */}
            <div className="ml-4 flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={addSampleTable}
              >
                <Table className="h-3.5 w-3.5 mr-1" /> Add Sample Table
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => clearProcessedDocuments()}
              >
                Clear Cache
              </Button>
            </div>
          </div>
          <DocumentSelector 
            documents={processedDocuments} 
            onDocumentChange={handleDocumentChange} 
          />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 flex-grow overflow-hidden">
        <MessageList messages={messages} isProcessing={isProcessing} />
      </CardContent>
      
      <CardFooter className="p-4 border-t pt-4">
        <MessageInput 
          message={message}
          setMessage={setMessage}
          handleSendMessage={handleSendMessage}
          isProcessing={isProcessing}
        />
      </CardFooter>
    </Card>
  );
};

export default AIAssistant;
