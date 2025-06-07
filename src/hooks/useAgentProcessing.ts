
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
}

export function useAgentProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingResults, setProcessingResults] = useState<any>(null);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [agentsHistory, setAgentsHistory] = useState<Array<{
    id: string;
    status: 'pending' | 'active' | 'complete' | 'error';
    timestamp: Date;
  }>>([]);
  
  const { toast } = useToast();

  // Define available agents
  const agents: AgentInfo[] = [
    {
      id: 'DataInput',
      name: 'Data Input Agent',
      description: 'Handles file input and validation'
    },
    {
      id: 'OCRExtraction',
      name: 'OCR Extraction Agent',
      description: 'Extracts text from images and scanned documents'
    },
    {
      id: 'PDFTableExtraction',
      name: 'PDF Table Extraction Agent',
      description: 'Extracts tables from PDF documents'
    },
    {
      id: 'DynamicTableDetection',
      name: 'Dynamic Table Detection Agent',
      description: 'Detects and extracts tables dynamically'
    },
    {
      id: 'DisplayAgent',
      name: 'Display Agent',
      description: 'Formats and displays extracted data'
    }
  ];

  const startProcessing = async (files: File[]) => {
    console.log('🚀 useAgentProcessing: Starting processing for', files.length, 'files');
    setIsProcessing(true);
    setProcessingComplete(false);
    setProcessingResults(null);

    try {
      // Import and use the POProcessor
      const { POProcessor } = await import('@/components/ingestion/drive/processing/POProcessor');
      const processor = new POProcessor();
      
      toast({
        title: "Processing Started",
        description: `Processing ${files.length} file(s) for PO data extraction...`,
      });

      const results = await processor.processFiles(files);
      
      console.log('✅ useAgentProcessing: Processing complete, results:', results);
      
      setProcessingResults(results);
      setProcessingComplete(true);
      
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      const skippedCount = results.filter(r => r.status === 'skipped').length;
      
      toast({
        title: "Processing Complete",
        description: `Success: ${successCount}, Errors: ${errorCount}, Skipped: ${skippedCount}`,
      });

    } catch (error) {
      console.error('❌ useAgentProcessing: Processing error:', error);
      
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "An error occurred during processing",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processFiles = async (files: any[], options?: any) => {
    // Convert to File[] if needed
    const fileObjects = files.map(f => f.file || f);
    return startProcessing(fileObjects);
  };

  const resetProcessing = () => {
    console.log('🔄 useAgentProcessing: Resetting processing state');
    setIsProcessing(false);
    setProcessingComplete(false);
    setProcessingResults(null);
    setActiveAgent(null);
    setAgentsHistory([]);
  };

  return {
    isProcessing,
    processingComplete,
    processingResults,
    activeAgent,
    agentsHistory,
    agents,
    startProcessing,
    processFiles,
    resetProcessing
  };
}
