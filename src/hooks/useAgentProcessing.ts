
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAgentGraph } from '@/services/agents/AgentRegistry';

export function useAgentProcessing() {
  const [processing, setProcessing] = useState(false);
  const [processingResults, setProcessingResults] = useState<any>(null);
  const [processingComplete, setProcessingComplete] = useState(false);
  const { toast } = useToast();

  // Process files using the agent system
  const processFiles = async (files: any[], options?: any) => {
    setProcessing(true);
    setProcessingComplete(false);
    setProcessingResults(null);
    
    console.log("Starting processing with options:", options);
    
    try {
      console.log("Starting agent processing with", files.length, "files");
      console.log("Files:", files.map(f => ({
        id: f.id,
        name: f.file?.name,
        type: f.file?.type,
        backendId: f.backendId,
        size: f.file?.size,
        lastModified: f.file?.lastModified
      })));
      console.log("Using Gemini:", Boolean(options?.useGemini));
      console.log("Options:", options);
      
      // Initialize the agent graph
      const agentGraph = getAgentGraph();
      
      // Create processing context with options
      const context = {
        options: options || {},
      };
      
      // Process the files with the DataInput agent
      const result = await agentGraph.process(files, "DataInput", context);
      
      console.log("Agent processing result:", result);
      
      if (!result.success) {
        console.error("Agent processing failed:", result.error);
        toast({
          title: "Processing Error",
          description: result.error || "An unknown error occurred during processing",
          variant: "destructive",
        });
        return null;
      }
      
      console.log("Agent processing complete, results:", result.data);
      setProcessingResults(result.data);
      setProcessingComplete(true);
      
      return result.data;
    } catch (error) {
      console.error("Error in agent processing:", error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      return null;
    } finally {
      setProcessing(false);
    }
  };

  // Reset processing state
  const resetProcessing = () => {
    setProcessingComplete(false);
    setProcessingResults(null);
  };

  return {
    processing,
    processingResults,
    processingComplete,
    processFiles,
    resetProcessing
  };
}
