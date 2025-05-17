import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocumentPreview from '../../ingestion/DocumentPreview';
import ExtractedTablePreview from '../../ingestion/ExtractedTablePreview';
import GeminiInsightsPanel from '../GeminiInsightsPanel';
import { saveProcessedTables } from '@/utils/documentStorage';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileJson, Files } from 'lucide-react';

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
  
  // If we have extractedTables, use those instead
  const extractedTables = processingResults?.extractedTables || [];
  const allTables = extractedTables.length > 0 ? extractedTables : tablesData;
  
  // Export to CSV
  const handleExportCSV = () => {
    if (!allTables || allTables.length === 0) {
      if (!processingResults?.tableData) {
        toast({
          title: "Export failed",
          description: "No table data available to export",
          variant: "destructive",
        });
        return;
      }
      
      // Use tableData instead
      try {
        // Create CSV content
        let csvContent = '';
        
        // Add headers
        csvContent += processingResults.tableData.headers.map((h: string) => `"${h}"`).join(',') + '\n';
        
        // Add rows
        csvContent += processingResults.tableData.rows.map((row: string[]) => 
          row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
        
        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `extracted_table.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        toast({
          title: "Export successful",
          description: "Table exported as CSV",
        });
      } catch (error) {
        toast({
          title: "Export failed",
          description: error instanceof Error ? error.message : "Unknown error during export",
          variant: "destructive",
        });
      }
      return;
    }
    
    // Export the first table in the array
    const tableToExport = allTables[0];
    
    try {
      // Create CSV content
      let csvContent = '';
      
      // Add headers
      csvContent += tableToExport.headers.map((h: string) => `"${h}"`).join(',') + '\n';
      
      // Add rows
      csvContent += tableToExport.rows.map((row: string[]) => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${tableToExport.title || 'extracted_table'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Export successful",
        description: "Table exported as CSV",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error during export",
        variant: "destructive",
      });
    }
  };

  // Export to JSON
  const handleExportJSON = () => {
    if (!allTables || allTables.length === 0) {
      if (!processingResults?.tableData) {
        toast({
          title: "Export failed",
          description: "No table data available to export",
          variant: "destructive",
        });
        return;
      }
      
      // Use tableData instead
      try {
        const jsonData = {
          headers: processingResults.tableData.headers,
          rows: processingResults.tableData.rows
        };
        
        // Create and download the file
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `extracted_table.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        toast({
          title: "Export successful",
          description: "Table exported as JSON",
        });
      } catch (error) {
        toast({
          title: "Export failed",
          description: error instanceof Error ? error.message : "Unknown error during export",
          variant: "destructive",
        });
      }
      return;
    }
    
    // Check if there's a consolidated JSON available
    if (processingResults.consolidatedJson) {
      try {
        // Create and download the file
        const blob = new Blob([processingResults.consolidatedJson], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `extracted_tables.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        toast({
          title: "Export successful",
          description: "All tables exported as JSON",
        });
        return;
      } catch (error) {
        console.error("Error exporting consolidated JSON:", error);
        // Fall back to exporting individual tables
      }
    }
    
    // Export all tables in the array
    try {
      const jsonData = allTables.map(table => ({
        title: table.title || "Extracted Table",
        headers: table.headers,
        rows: table.rows
      }));
      
      // Create and download the file
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `extracted_tables.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Export successful",
        description: "Tables exported as JSON",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error during export",
        variant: "destructive",
      });
    }
  };
    
  // Save extracted tables to Supabase and localStorage
  useEffect(() => {
    const saveToSupabase = async () => {
      // Skip if no processing results
      if (!processingResults) return;
      
      let dataToSave = [];
      
      // Prepare data from tables array or consolidatedJson
      if (processingResults.consolidatedJson) {
        console.log("Using consolidated JSON for Supabase storage");
        const fileName = files.length > 0 ? files[0].name : "extracted-data";
        
        dataToSave.push({
          title: fileName,
          headers: ['extracted_data'],
          rows: [[processingResults.consolidatedJson]],
          confidence: 0.9,
          file_id: processingResults?.fileId
        });
      } 
      // Check for tables array
      else if (allTables.length > 0) {
        console.log("No consolidated JSON, using extracted tables for Supabase storage");
        
        // Just store consolidated format instead of individual tables
        const tableJson = JSON.stringify(allTables);
        const fileName = files.length > 0 ? files[0].name : "extracted-data";
        
        dataToSave.push({
          title: fileName,
          headers: ['extracted_data'],
          rows: [[tableJson]],
          confidence: 0.9,
          file_id: processingResults?.fileId
        });
      }
      // Check for tableData in processingResults
      else if (processingResults?.tableData && processingResults.tableData.headers) {
        console.log("No tables array, using tableData for Supabase storage");
        const tableJson = JSON.stringify([{
          title: 'Extracted Table Data',
          headers: processingResults.tableData.headers,
          rows: processingResults.tableData.rows
        }]);
        
        const fileName = files.length > 0 ? files[0].name : "extracted-data";
        
        dataToSave.push({
          title: fileName,
          headers: ['extracted_data'],
          rows: [[tableJson]],
          confidence: processingResults.tableData.metadata?.confidence || 0.9,
          file_id: processingResults?.fileId
        });
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
      if (allTables.length > 0) {
        try {
          console.log("Saving extracted tables to localStorage:", allTables);
          saveProcessedTables(allTables, processingResults?.processingId);
        } catch (error) {
          console.error("Error saving processed tables to localStorage:", error);
        }
      }
      
      // Check for tableData in processingResults and save if available
      if (processingResults?.tableData && processingResults.tableData.headers) {
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
      
      // Dispatch event to notify components that new tables are processed
      window.dispatchEvent(new CustomEvent('documentProcessed'));
    };
    
    // Run the save operation if we have processing results
    if (processingResults) {
      saveToSupabase();
    }
  }, [processingResults, toast, allTables, files]);
  
  return (
    <div className="space-y-4">
      <Tabs defaultValue="results" className="w-full">
        <TabsList>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="original">Original Document</TabsTrigger>
        </TabsList>
        
        <TabsContent value="results" className="border rounded-md p-4">
          {allTables.length > 0 ? (
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                  >
                    <Files className="h-4 w-4 mr-1" /> Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportJSON}
                  >
                    <FileJson className="h-4 w-4 mr-1" /> Export JSON
                  </Button>
                </div>
              </div>
              
              {allTables.map((tableData: any, index: number) => (
                <div key={index} className="border rounded p-2">
                  <ExtractedTablePreview
                    initialData={{
                      headers: tableData.headers,
                      rows: tableData.rows
                    }}
                    displayFormat={displayFormat}
                    tableName={tableData.title || `Table ${index + 1}`}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                  >
                    <Files className="h-4 w-4 mr-1" /> Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportJSON}
                  >
                    <FileJson className="h-4 w-4 mr-1" /> Export JSON
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
                  tableName="Extracted Table"
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
