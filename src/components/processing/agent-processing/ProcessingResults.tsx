
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Eye, Table, Sparkles } from 'lucide-react';
import DocumentPreview from '../../ingestion/DocumentPreview';
import ExtractedTablePreview from '../../ingestion/ExtractedTablePreview';
import { UploadedFile } from '@/types/fileUpload';
import ProcessingStats from './ProcessingStats';

interface ProcessingResultsProps {
  processingResults: any;
  hasFileToPreview: boolean;
  getFileUrl: () => string | null;
  files: UploadedFile[];
}

export const ProcessingResults: React.FC<ProcessingResultsProps> = ({
  processingResults,
  hasFileToPreview,
  getFileUrl,
  files
}) => {
  // Check if we have table data to display
  const hasTableData = processingResults?.tableData || 
                     (processingResults?.extractedTables && processingResults.extractedTables.length > 0);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Processing Results</h3>
      
      <ProcessingStats processingResults={processingResults} />
      
      {/* Tabs for Document Preview and Extracted Data */}
      <Tabs defaultValue="document" className="w-full mt-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="document" className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> Document
          </TabsTrigger>
          <TabsTrigger value="extraction" className="flex items-center gap-1">
            <Table className="h-3.5 w-3.5" /> Extracted Tables
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="document" className="mt-4 border rounded-md p-4">
          {hasFileToPreview ? (
            <DocumentPreview fileUrl={getFileUrl()} fileName={files[0].file?.name} fileType={files[0].file?.type} />
          ) : (
            <div className="text-center p-6 text-muted-foreground">
              No document available for preview
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="extraction" className="mt-4">
          {hasTableData ? (
            <div className="space-y-4">
              {processingResults.extractedText && (
                <div className="border rounded-md p-4 bg-muted/10">
                  <h4 className="text-sm font-medium mb-2">Extracted Text</h4>
                  <div className="text-sm max-h-60 overflow-y-auto whitespace-pre-wrap bg-muted/5 p-3 rounded">
                    {processingResults.extractedText}
                  </div>
                </div>
              )}
              
              <div className="border rounded-md p-4">
                <h4 className="text-sm font-medium mb-2">Extracted Tables</h4>
                {processingResults.tableData ? (
                  <ExtractedTablePreview 
                    initialData={{
                      headers: processingResults.tableData.headers,
                      rows: processingResults.tableData.rows
                    }}
                  />
                ) : processingResults.extractedTables && processingResults.extractedTables.length > 0 ? (
                  <ExtractedTablePreview 
                    initialData={{
                      headers: processingResults.extractedTables[0].headers,
                      rows: processingResults.extractedTables[0].rows
                    }}
                  />
                ) : (
                  <div className="text-center p-6 text-muted-foreground">
                    No tables were extracted from this document
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center p-6 text-muted-foreground">
              No extraction data available
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Insights from Gemini */}
      {processingResults.insights && (
        <div className="p-4 border rounded-md bg-blue-50/30 mt-4">
          <h4 className="text-sm font-medium mb-2 flex items-center">
            <Sparkles className="h-4 w-4 mr-1 text-blue-500" /> 
            Gemini AI Insights
          </h4>
          <div className="text-sm">
            {processingResults.insights.summary || "No insights available"}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingResults;
