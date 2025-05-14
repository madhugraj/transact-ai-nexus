
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAgentGraph } from '@/services/agents/AgentRegistry';
import { ProcessingOptions } from '@/types/processing';
import { UploadedFile } from '@/types/fileUpload';

export function useAgentProcessing() {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingResults, setProcessingResults] = useState<any>(null);
  const { toast } = useToast();

  // Initialize the agent graph
  const agentGraph = getAgentGraph();
  
  // Start the processing pipeline with the DataInput agent
  const processFiles = async (
    files: UploadedFile[], 
    options: ProcessingOptions = {}
  ) => {
    if (files.length === 0) {
      toast({
        title: "No files to process",
        description: "Please select files for processing",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      toast({
        title: "Processing started",
        description: `Processing ${files.length} files through agent system`,
      });
      
      const context = { options };
      const result = await agentGraph.process(files, "DataInput", context);
      
      if (result.success) {
        setProcessingId(result.data.processingId);
        setProcessingResults(result.data);
        setProcessingComplete(true);
        
        toast({
          title: "Processing complete",
          description: `${files.length} files processed successfully`,
        });
      } else {
        toast({
          title: "Processing failed",
          description: result.error || "An unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Processing error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Reset the processing state
  const resetProcessing = () => {
    setProcessingId(null);
    setProcessingResults(null);
    setProcessingComplete(false);
  };
  
  return {
    processingId,
    isProcessing,
    processingComplete,
    processingResults,
    processFiles,
    resetProcessing,
    agents: agentGraph.getAvailableAgents()
  };
}
