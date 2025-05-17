import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocumentPreview from '../../ingestion/DocumentPreview';
import ExtractedTablePreview from '../../ingestion/ExtractedTablePreview';
import GeminiInsightsPanel from '../GeminiInsightsPanel';
import { saveProcessedTables } from '@/utils/documentStorage';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  
  // Make sure tables data is in the right format
  const tablesData = processingResults?.tables 
    ? Array.isArray(processingResults.tables) 
      ? processingResults.tables 
      : [processingResults.tables]
    : [];
    
  // Save extracted tables to Supabase and localStorage
  useEffect(() => {
    const saveToSupabase = async () => {
      let dataToSave = [];
      
      // Check for tables array
      if (tablesData.length > 0) {
        console.log("Saving extracted tables to Supabase:", tablesData);
        dataToSave = tablesData.map(table => ({
          title: table.title || 'Extracted Table',
          headers: table.headers,
          rows: table.rows,
          confidence: table.confidence || 0.9,
          file_id: processingResults?.fileId
        }));
      }
      
      // Check for tableData in processingResults
      if (processingResults?.tableData && processingResults.tableData.headers) {
        console.log("Saving table data to Supabase:", processingResults.tableData);
        dataToSave.push({
          title: 'Extracted Table Data',
          headers: processingResults.tableData.headers,
          rows: processingResults.tableData.rows,
          confidence: processingResults.tableData.metadata?.confidence || 0.9,
          file_id: processingResults?.fileId
        });
      }
      
      // Check for extractedTables in processingResults
      if (processingResults?.extractedTables && processingResults.extractedTables.length > 0) {
        console.log("Saving extracted tables array to Supabase:", processingResults.extractedTables);
        const extractedTableData = processingResults.extractedTables.map(table => ({
          title: table.title || 'Extracted Table',
          headers: table.headers,
          rows: table.rows,
          confidence: table.confidence || 0.9,
          file_id: processingResults?.fileId
        }));
        dataToSave = [...dataToSave, ...extractedTableData];
      }
      
      // Insert data into Supabase if we have any
      if (dataToSave.length > 0) {
        try {
          const { data, error } = await supabase
            .from('extracted_tables')
            .insert(dataToSave)
            .select();
            
          if (error) {
            console.error("Error saving to Supabase:", error);
            toast({
              title: "Error saving tables",
              description: "Could not save tables to database. Using local storage instead.",
              variant: "destructive",
            });
            
            // Save to localStorage as fallback
            fallbackToLocalStorage();
          } else {
            console.log("Tables saved to Supabase successfully:", data);
            
            // Still save to localStorage for redundancy
            fallbackToLocalStorage();
            
            // Dispatch event to notify components that new tables are processed
            window.dispatchEvent(new CustomEvent('documentProcessed'));
          }
        } catch (error) {
          console.error("Exception saving to Supabase:", error);
          toast({
            title: "Error saving tables",
            description: "Could not save tables to database. Using local storage instead.",
            variant: "destructive",
          });
          
          // Save to localStorage as fallback
          fallbackToLocalStorage();
        }
      }
    };
    
    // Function to save to localStorage as fallback
    const fallbackToLocalStorage = () => {
      // Store tables in localStorage for AI Assistant
      if (tablesData.length > 0) {
        try {
          console.log("Saving extracted tables to localStorage:", tablesData);
          saveProcessedTables(tablesData, processingResults?.processingId);
        } catch (error) {
          console.error("Error saving processed tables to localStorage:", error);
        }
      }
      
      // Check for tableData in processingResults and save if available
      if (processingResults?.tableData) {
        try {
          console.log("Saving table data to localStorage:", processingResults.tableData);
          const tableDataToSave = {
            id: `table-data-${Date.now()}`,
            title: 'Extracted Table Data',
            name: 'Extracted Table Data',
            headers: processingResults.tableData.headers,
            rows: processingResults.tableData.rows,
            type: 'table',
            extractedAt: new Date().toISOString()
          };
          
          saveProcessedTables([tableDataToSave], processingResults?.processingId);
        } catch (error) {
          console.error("Error saving table data to localStorage:", error);
        }
      }
      
      // Check for extractedTables in processingResults and save if available
      if (processingResults?.extractedTables && processingResults.extractedTables.length > 0) {
        try {
          console.log("Saving extracted tables array to localStorage:", processingResults.extractedTables);
          saveProcessedTables(processingResults.extractedTables, processingResults?.processingId);
        } catch (error) {
          console.error("Error saving extracted tables array to localStorage:", error);
        }
      }
      
      // Dispatch event to notify components that new tables are processed
      window.dispatchEvent(new CustomEvent('documentProcessed'));
    };
    
    // Run the save operation if we have processing results
    if (processingResults) {
      saveToSupabase();
    }
  }, [processingResults, toast]);
  
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
                    Response (Structured)
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
          ) : processingResults?.tableData ? (
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
                    Response (Structured)
                  </Button>
                </div>
              </div>
              
              <div className="border rounded p-2">
                <ExtractedTablePreview
                  initialData={{
                    headers: processingResults.tableData.headers,
                    rows: processingResults.tableData.rows
                  }}
                  displayFormat={displayFormat}
                />
              </div>
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
            <DocumentPreview 
              fileUrl={getFileUrl()} 
              fileName={files.length > 0 ? files[0].name : undefined}
              fileType={files.length > 0 ? files[0].type : undefined}
              height="500px"
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p>No document preview available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProcessingResults;
