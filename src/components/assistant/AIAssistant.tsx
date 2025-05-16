
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import DocumentSelector from './DocumentSelector';
import useAIAssistant from '@/hooks/useAIAssistant';
import { PieChart, BarChart3, Table } from 'lucide-react';

const AIAssistant: React.FC = () => {
  const {
    message,
    setMessage,
    messages,
    isProcessing,
    processedDocuments,
    selectedDocument,
    handleSendMessage,
    handleDocumentChange
  } = useAIAssistant();

  const hasDocuments = processedDocuments.length > 0;
  const hasSelectedDocument = Boolean(selectedDocument);
  const hasTableSelected = selectedDocument && processedDocuments.find(d => d.id === selectedDocument)?.type === 'table';

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="border-b px-6 py-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            Document AI Assistant
            {hasTableSelected && (
              <Badge variant="secondary" className="ml-2 flex items-center gap-1">
                <Table className="h-3 w-3" /> Table Analysis
              </Badge>
            )}
          </div>
          <DocumentSelector 
            documents={processedDocuments} 
            onDocumentChange={handleDocumentChange}
            selectedDocument={selectedDocument}
          />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 flex-grow overflow-hidden">
        <MessageList messages={messages} isProcessing={isProcessing} />
      </CardContent>
      
      <CardFooter className="p-4 border-t pt-4">
        {!hasDocuments && (
          <div className="w-full bg-amber-50 border border-amber-200 rounded p-2 mb-3 text-amber-800 text-sm">
            <p className="font-medium">No documents found</p>
            <p className="text-xs mt-1">To get started, process documents in the Documents section first.</p>
          </div>
        )}
        <MessageInput 
          message={message}
          setMessage={setMessage}
          handleSendMessage={handleSendMessage}
          isProcessing={isProcessing}
          placeholder={hasSelectedDocument 
            ? "Ask a question about this data..." 
            : hasDocuments 
              ? "Select a document first, then ask questions..." 
              : "Process documents first to enable AI analysis..."
          }
          disabled={isProcessing || (!hasDocuments || !hasSelectedDocument)}
        />
      </CardFooter>
      
      {hasTableSelected && (
        <div className="px-4 pb-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <PieChart className="h-3 w-3" /> Basic Charts
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" /> Data Analysis
          </div>
          <div className="flex items-center gap-1">
            <Table className="h-3 w-3" /> Table Visualization
          </div>
        </div>
      )}
    </Card>
  );
};

export default AIAssistant;
