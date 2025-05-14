
import React, { useState } from 'react';
import { useAgentProcessing } from '@/hooks/useAgentProcessing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadedFile } from '@/types/fileUpload';
import { ProcessingOptions } from '@/types/processing';
import { FileText, Database, Layers, Sparkles, Settings, Brain, Eye, Table } from 'lucide-react';
import DocumentPreview from '../ingestion/DocumentPreview';
import ExtractedTablePreview from '../ingestion/ExtractedTablePreview';
import { useToast } from '@/hooks/use-toast';

interface AgentProcessingSystemProps {
  files: UploadedFile[];
  options?: ProcessingOptions;
  onComplete?: (results: any) => void;
}

const AgentProcessingSystem: React.FC<AgentProcessingSystemProps> = ({
  files,
  options = {},
  onComplete
}) => {
  const {
    isProcessing,
    processingComplete,
    processingResults,
    processFiles,
    resetProcessing,
    agents
  } = useAgentProcessing();
  
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Start processing with the agent system
  const handleStartProcessing = async () => {
    console.log("Starting processing with files:", files);
    console.log("Starting processing with options:", options);
    
    try {
      await processFiles(files, {
        ...options,
        useGemini: true  // Enable Gemini processing
      });
      
      // Notify parent component when processing is complete
      if (onComplete && processingResults) {
        console.log("Processing complete, notifying parent with results:", processingResults);
        onComplete(processingResults);
      }
    } catch (error) {
      console.error("Processing failed:", error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  // Get icon for agent type
  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'DataInput': return <FileText className="h-5 w-5" />;
      case 'OCRExtraction': return <Settings className="h-5 w-5" />;
      case 'PDFTableExtraction': return <FileText className="h-5 w-5" />;
      case 'DynamicTableDetection': return <Layers className="h-5 w-5" />;
      case 'DisplayAgent': return <Sparkles className="h-5 w-5" />;
      default: return <Settings className="h-5 w-5" />;
    }
  };

  // Check if we have a file to preview
  const hasFileToPreview = files.length > 0 && files[0].file !== undefined;
  
  // Get file URL for preview
  const getFileUrl = () => {
    if (!hasFileToPreview) return null;
    return URL.createObjectURL(files[0].file!);
  };
  
  // Check if we have table data to display
  const hasTableData = processingResults?.tableData || 
                       (processingResults?.extractedTables && processingResults.extractedTables.length > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span>Agent Processing System</span>
              <Badge variant="outline" className="bg-blue-50/50 text-blue-600 hover:bg-blue-100">
                <Brain className="h-3.5 w-3.5 mr-1" />
                Gemini AI
              </Badge>
            </div>
            {isProcessing && (
              <Badge variant="outline" className="bg-blue-50 text-blue-600">
                Processing
              </Badge>
            )}
            {processingComplete && (
              <Badge variant="outline" className="bg-green-50 text-green-600">
                Complete
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {/* Agent List */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Processing Agents with Gemini AI</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {agents.map((agent) => (
                  <div 
                    key={agent.id}
                    className={`p-3 border rounded-md cursor-pointer transition-colors
                      ${activeAgentId === agent.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                    onClick={() => setActiveAgentId(agent.id)}
                  >
                    <div className="flex items-center">
                      {getAgentIcon(agent.id)}
                      <div className="ml-3">
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-xs text-muted-foreground">{agent.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            {/* Processing Status */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing with Gemini AI...</span>
                  <span>Please wait</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
            )}
            
            {/* Document and Results Preview */}
            {processingComplete && processingResults ? (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Processing Results</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 border rounded-md bg-muted/10">
                    <div className="text-xs text-muted-foreground">Processing ID</div>
                    <div className="font-medium truncate">{processingResults.processingId}</div>
                  </div>
                  <div className="p-3 border rounded-md bg-muted/10">
                    <div className="text-xs text-muted-foreground">Tables Extracted</div>
                    <div className="font-medium">{processingResults.tableCount || 0}</div>
                  </div>
                  <div className="p-3 border rounded-md bg-muted/10">
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="font-medium">
                      {processingResults.extractionComplete ? "Complete" : "Processing"}
                    </div>
                  </div>
                  <div className="p-3 border rounded-md bg-muted/10">
                    <div className="text-xs text-muted-foreground">AI Provider</div>
                    <div className="font-medium flex items-center">
                      <Brain className="h-3.5 w-3.5 mr-1 text-blue-500" />
                      Gemini
                    </div>
                  </div>
                </div>
                
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
            ) : (
              // Preview section when no results yet
              <div className="p-6 border rounded-md text-center">
                {hasFileToPreview ? (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Document Preview</h4>
                    <DocumentPreview fileUrl={getFileUrl()} fileName={files[0].file?.name} fileType={files[0].file?.type} />
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    Select files to preview and process
                  </div>
                )}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              {processingComplete ? (
                <Button onClick={resetProcessing} variant="outline">
                  Process New Files
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleStartProcessing}
                    disabled={isProcessing || files.length === 0}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    Start Processing with Gemini
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentProcessingSystem;
