
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { POProcessor } from './processing/POProcessor';
import ProcessingStats from './processing/ProcessingStats';
import { Loader, Play, X } from 'lucide-react';

interface ProcessingSectionProps {
  downloadedFiles: File[];
  onProcessingComplete: (results: any[]) => void;
  onClose: () => void;
}

const ProcessingSection = ({ downloadedFiles, onProcessingComplete, onClose }: ProcessingSectionProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResults, setProcessingResults] = useState<any[]>([]);
  const { toast } = useToast();

  if (downloadedFiles.length === 0) return null;

  const processPOFiles = async () => {
    console.log(`🚀 Starting to process ${downloadedFiles.length} files...`);
    setIsProcessing(true);
    setProcessingResults([]);

    try {
      const processor = new POProcessor();
      console.log(`📝 Processing files:`, downloadedFiles.map(f => f.name));
      
      const results = await processor.processFiles(downloadedFiles);
      console.log(`📊 Processing results:`, results);
      
      setProcessingResults(results);
      
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      const skippedCount = results.filter(r => r.status === 'skipped').length;
      
      console.log(`📈 Processing summary: ${successCount} success, ${errorCount} errors, ${skippedCount} skipped`);
      
      if (successCount > 0) {
        toast({
          title: "Processing Complete",
          description: `Successfully processed ${successCount} PO files. ${errorCount > 0 ? `${errorCount} errors. ` : ''}${skippedCount > 0 ? `${skippedCount} files skipped.` : ''}`,
          variant: errorCount > successCount ? "destructive" : "default"
        });
      } else if (errorCount > 0) {
        toast({
          title: "Processing Failed",
          description: `${errorCount} files failed to process. ${skippedCount > 0 ? `${skippedCount} files were not POs.` : ''}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "No PO Files Found",
          description: `${skippedCount} files were analyzed but none were identified as Purchase Orders.`,
        });
      }

      onProcessingComplete(results);
    } catch (error) {
      console.error(`❌ Processing error:`, error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process files",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-muted/10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-sm">Ready to Process</h3>
          <p className="text-xs text-muted-foreground">
            {downloadedFiles.length} file{downloadedFiles.length !== 1 ? 's' : ''} ready for PO analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={processPOFiles}
            disabled={isProcessing}
            size="sm"
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Process Files
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ProcessingStats results={processingResults} isProcessing={isProcessing} />
    </div>
  );
};

export default ProcessingSection;
