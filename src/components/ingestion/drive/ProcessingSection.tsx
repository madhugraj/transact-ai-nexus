
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { POProcessor } from './processing/POProcessor';
import ProcessingStats from './processing/ProcessingStats';
import { Loader, Play } from 'lucide-react';

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
    setIsProcessing(true);
    setProcessingResults([]);

    try {
      const processor = new POProcessor();
      const results = await processor.processFiles(downloadedFiles);
      
      setProcessingResults(results);
      
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      toast({
        title: "Processing Complete",
        description: `Processed ${downloadedFiles.length} files. ${successCount} successful${errorCount > 0 ? `, ${errorCount} errors` : ''}.`,
        variant: errorCount > 0 ? "destructive" : "default"
      });

      onProcessingComplete(results);
    } catch (error) {
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
    <div className="border rounded-lg p-4 bg-muted/20">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium">Process Files</h3>
          <p className="text-sm text-muted-foreground">
            {downloadedFiles.length} file(s) ready
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
                Process
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <ProcessingStats results={processingResults} isProcessing={isProcessing} />
    </div>
  );
};

export default ProcessingSection;
