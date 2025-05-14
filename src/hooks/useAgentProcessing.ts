
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
  const [processingError, setProcessingError] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize the agent graph
  const agentGraph = getAgentGraph();
  
  // Start the processing pipeline with the DataInput agent
  const processFiles = async (
    files: UploadedFile[], 
    options: ProcessingOptions = {}
  ) => {
    if (files.length === 0) {
      console.error("No files provided for processing");
      toast({
        title: "No files to process",
        description: "Please select files for processing",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    setProcessingError(null);
    console.log("Starting processing with options:", options);
    
    try {
      toast({
        title: "Processing started",
        description: `Processing ${files.length} files through agent system`,
      });
      
      const context = { options };
      
      // Log important information before processing
      console.log(`Starting agent processing with ${files.length} files`);
      console.log("Files:", files.map(f => ({ 
        id: f.id, 
        name: f.file?.name, 
        type: f.file?.type,
        backendId: f.backendId,
        size: f.file?.size,
        lastModified: f.file?.lastModified
      })));
      console.log("Using Gemini:", options.useGemini);
      console.log("Options:", JSON.stringify(options, null, 2));
      
      // Process through the agent pipeline
      const result = await agentGraph.process(files, "DataInput", context);
      
      console.log("Agent processing result:", result);
      
      if (result.success) {
        console.log("Agent processing completed successfully:", result.data);
        setProcessingId(result.data.processingId);
        
        // Make sure to log table data specifically for debugging
        if (result.data.tableData) {
          console.log("Table data received:", result.data.tableData);
        } else if (result.data.extractedTables && result.data.extractedTables.length > 0) {
          console.log("Extracted tables received:", result.data.extractedTables);
        } else {
          console.warn("No table data found in processing results");
        }
        
        setProcessingResults(result.data);
        setProcessingComplete(true);
        
        toast({
          title: "Processing complete",
          description: `${files.length} files processed successfully`,
        });
      } else {
        console.error("Agent processing failed:", result.error);
        setProcessingError(result.error || "An unknown error occurred");
        
        toast({
          title: "Processing failed",
          description: result.error || "An unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Agent processing error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setProcessingError(errorMessage);
      
      toast({
        title: "Processing error",
        description: errorMessage,
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
    setProcessingError(null);
  };
  
  return {
    processingId,
    isProcessing,
    processingComplete,
    processingResults,
    processingError,
    processFiles,
    resetProcessing,
    agents: agentGraph.getAvailableAgents()
  };
}
