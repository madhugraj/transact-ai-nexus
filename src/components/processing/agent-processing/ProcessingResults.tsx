
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocumentPreview from '../../ingestion/DocumentPreview';
import ExtractedTablePreview from '../../ingestion/ExtractedTablePreview';
import GeminiInsightsPanel from '../GeminiInsightsPanel';

interface ProcessingResultsProps {
  processingResults: any;
  hasFileToPreview: boolean;
  getFileUrl: () => string | null;
  files: any[];
}

export const ProcessingResults = ({ 
  processingResults, 
  hasFileToPreview, 
  getFileUrl,
  files 
}: ProcessingResultsProps) => {
  const [displayFormat, setDisplayFormat] = useState<'table' | 'json'>('table');
  
  // Make sure tables data is in the right format
  const tablesData = processingResults?.tables 
    ? Array.isArray(processingResults.tables) 
      ? processingResults.tables 
      : [processingResults.tables]
    : [];
  
  // Store tables in localStorage for AI Assistant
  if (tablesData.length > 0) {
    try {
      // Get existing processed tables or initialize empty array
      const existingTables = localStorage.getItem('processedTables');
      const processedTables = existingTables ? JSON.parse(existingTables) : [];
      
      // Add newly processed tables with timestamp if they don't exist
      const newProcessedTables = tablesData
        .filter((table: any) => !table.id) // Only add tables that don't have IDs yet
        .map((table: any) => ({
          ...table,
          id: `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: table.name || 'Extracted Table',
          extractedAt: new Date().toISOString()
        }));
      
      // Update localStorage with combined array if we have new tables
      if (newProcessedTables.length > 0) {
        localStorage.setItem('processedTables', JSON.stringify([...processedTables, ...newProcessedTables]));
        // Dispatch event to notify components that new tables are processed
        window.dispatchEvent(new CustomEvent('documentProcessed'));
      }
    } catch (error) {
      console.error("Error saving processed tables to localStorage:", error);
    }
  }
  
  return (
    <div className="space-y-4">
      <Tabs defaultValue="results" className="w-full">
        <TabsList>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="original">Original Document</TabsTrigger>
        </TabsList>
        
        <TabsContent value="results" className="border rounded-md p-4">
          {tablesData.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Extracted Table Data</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={displayFormat === 'table' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDisplayFormat('table')}
                  >
                    Table View
                  </Button>
                  <Button
                    variant={displayFormat === 'json' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDisplayFormat('json')}
                  >
                    JSON View
                  </Button>
                </div>
              </div>
              
              {tablesData.map((tableData: any, index: number) => (
                <div key={index} className="border rounded p-2">
                  <ExtractedTablePreview
                    initialData={{
                      headers: tableData.headers,
                      rows: tableData.rows
                    }}
                    displayFormat={displayFormat}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6">
              <p className="text-muted-foreground">No table data was extracted from this document.</p>
            </div>
          )}
          
          {/* Display Gemini insights if available */}
          {processingResults?.insights && (
            <GeminiInsightsPanel 
              insights={processingResults.insights} 
              processingId={processingResults.processingId}
            />
          )}
        </TabsContent>
        
        <TabsContent value="original" className="border rounded-md p-4">
          {hasFileToPreview ? (
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Original Document</h3>
              <DocumentPreview
                fileUrl={getFileUrl()}
                fileName={files[0].file?.name}
                fileType={files[0].file?.type}
              />
            </div>
          ) : (
            <div className="text-center p-6">
              <p className="text-muted-foreground">Original document preview not available.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
