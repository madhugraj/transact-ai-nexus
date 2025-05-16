
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import DocumentSelector from './DocumentSelector';
import useAIAssistant from '@/hooks/useAIAssistant';
import { PieChart, BarChart3, Table as TableIcon, BrainCircuit, MessagesSquare, Loader2 } from 'lucide-react';

const AIAssistant: React.FC = () => {
  const {
    message,
    setMessage,
    messages,
    isProcessing,
    processedDocuments,
    selectedDocument,
    handleSendMessage,
    handleDocumentChange,
    isLoadingDocuments
  } = useAIAssistant();

  const hasDocuments = processedDocuments.length > 0;
  const hasSelectedDocument = Boolean(selectedDocument);
  const selectedDocumentData = processedDocuments.find(d => d.id === selectedDocument);
  const hasTableSelected = selectedDocumentData?.type === 'table';

  return (
    <Card className="w-full h-[650px] flex flex-col shadow-lg border-primary/10">
      <CardHeader className="border-b px-6 py-4 bg-gradient-to-r from-primary/5 to-background">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              Financial Data Assistant
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Ask questions about your documents and get AI-powered insights
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isLoadingDocuments && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Loading...
              </div>
            )}
            <DocumentSelector 
              documents={processedDocuments} 
              onDocumentChange={handleDocumentChange}
              selectedDocumentId={selectedDocument}
            />
          </div>
        </div>
        
        {hasTableSelected && selectedDocumentData && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1 bg-primary/5">
              <TableIcon className="h-3 w-3" /> 
              Table Analysis
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 bg-primary/5">
              <FileDigit className="h-3 w-3" /> 
              {selectedDocumentData?.name}
            </Badge>
            {selectedDocumentData.source && (
              <Badge variant="secondary" className="text-xs">
                {selectedDocumentData.source === 'supabase' ? 'Database' : 'Local Storage'}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0 flex-grow overflow-hidden bg-gradient-to-b from-background to-muted/10">
        <MessageList messages={messages} isProcessing={isProcessing} />
      </CardContent>
      
      <CardFooter className="p-5 border-t pt-4 bg-background">
        {!hasDocuments && (
          <div className="w-full bg-amber-50 border border-amber-200 rounded-md p-3 mb-3 text-amber-800 text-sm">
            <div className="flex items-start gap-2">
              <MessagesSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">No documents found</p>
                <p className="text-xs mt-1">To get started, process documents in the Documents section first.</p>
              </div>
            </div>
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
        <div className="px-5 pb-4 flex items-center justify-center gap-6 text-xs text-muted-foreground bg-background">
          <div className="flex items-center gap-1">
            <PieChart className="h-3.5 w-3.5 text-primary/80" /> Basic Charts
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 className="h-3.5 w-3.5 text-primary/80" /> Data Analysis
          </div>
          <div className="flex items-center gap-1">
            <TableIcon className="h-3.5 w-3.5 text-primary/80" /> Table Visualization
          </div>
        </div>
      )}
    </Card>
  );
};

export default AIAssistant;
