
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useAgentProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingResults, setProcessingResults] = useState<any>(null);
  const { toast } = useToast();

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

  const resetProcessing = () => {
    console.log('🔄 useAgentProcessing: Resetting processing state');
    setIsProcessing(false);
    setProcessingComplete(false);
    setProcessingResults(null);
  };

  return {
    isProcessing,
    processingComplete,
    processingResults,
    startProcessing,
    resetProcessing
  };
}
