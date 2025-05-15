
import React, { useState } from 'react';
import { useAgentProcessing } from '@/hooks/useAgentProcessing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UploadedFile } from '@/types/fileUpload';
import { ProcessingOptions } from '@/types/processing';
import { Brain, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AgentStatusVisualizer from './AgentStatusVisualizer';
import { AgentsList } from './agent-processing/AgentsList';
import { ProcessingControls } from './agent-processing/ProcessingControls';
import { ProcessingResults } from './agent-processing/ProcessingResults';
import DocumentPreview from '../ingestion/DocumentPreview';

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
    agents,
    activeAgent,
    agentsHistory
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

  // Check if we have a file to preview
  const hasFileToPreview = files.length > 0 && files[0].file !== undefined;
  
  // Get file URL for preview
  const getFileUrl = () => {
    if (!hasFileToPreview) return null;
    return URL.createObjectURL(files[0].file!);
  };

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
              <Badge variant="outline" className="bg-blue-50 text-blue-600 flex items-center">
                <Loader className="h-3.5 w-3.5 mr-1 animate-spin" />
                Processing...
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
            {/* Agent Status Visualizer */}
            {(isProcessing || processingComplete) && (
              <AgentStatusVisualizer 
                activeAgent={activeAgent}
                agentsHistory={agentsHistory}
                agents={agents}
              />
            )}
            
            {/* Agent List */}
            <AgentsList 
              agents={agents} 
              activeAgentId={activeAgentId} 
              setActiveAgentId={setActiveAgentId} 
            />
            
            <Separator />

            {/* Processing Results or Preview */}
            {processingComplete && processingResults ? (
              <ProcessingResults 
                processingResults={processingResults}
                hasFileToPreview={hasFileToPreview}
                getFileUrl={getFileUrl}
                files={files} 
              />
            ) : (
              <div className="p-6 border rounded-md">
                {isProcessing ? (
                  <div className="text-center space-y-4">
                    <Loader className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                    <p className="text-muted-foreground">Processing the document...</p>
                    <p className="text-xs text-muted-foreground">This may take a few moments depending on the document size.</p>
                  </div>
                ) : (
                  hasFileToPreview ? (
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Document Preview</h4>
                      <DocumentPreview fileUrl={getFileUrl()} fileName={files[0].file?.name} fileType={files[0].file?.type} />
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      Select files to preview and process
                    </div>
                  )
                )}
              </div>
            )}
            
            {/* Processing Controls */}
            <ProcessingControls 
              isProcessing={isProcessing}
              processingComplete={processingComplete}
              resetProcessing={resetProcessing}
              handleStartProcessing={handleStartProcessing}
              filesLength={files.length}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentProcessingSystem;
