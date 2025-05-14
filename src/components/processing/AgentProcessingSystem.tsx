
import React, { useState } from 'react';
import { useAgentProcessing } from '@/hooks/useAgentProcessing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { UploadedFile } from '@/types/fileUpload';
import { ProcessingOptions } from '@/types/processing';
import { FileText, Database, Layers, Sparkles, Settings } from 'lucide-react';

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
  
  // Start processing with the agent system
  const handleStartProcessing = async () => {
    await processFiles(files, options);
    // Notify parent component when processing is complete
    if (onComplete && processingResults) {
      onComplete(processingResults);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Agent Processing System</span>
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
              <h3 className="text-sm font-medium">Processing Agents</h3>
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
                  <span>Processing...</span>
                  <span>Please wait</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
            )}
            
            {/* Results Summary */}
            {processingComplete && processingResults && (
              <div className="space-y-3">
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
                    <div className="text-xs text-muted-foreground">Display Ready</div>
                    <div className="font-medium">{processingResults.displayReady ? "Yes" : "No"}</div>
                  </div>
                </div>
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
                    Start Processing
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
