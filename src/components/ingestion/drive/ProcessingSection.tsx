
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ProcessingStats from './processing/ProcessingStats';
import { Loader, Play, X } from 'lucide-react';
import { useAgentProcessing } from '@/hooks/useAgentProcessing';

interface ProcessingSectionProps {
  downloadedFiles: File[];
  onProcessingComplete: (results: any[]) => void;
  onClose: () => void;
}

const ProcessingSection = ({ downloadedFiles, onProcessingComplete, onClose }: ProcessingSectionProps) => {
  const { toast } = useToast();
  const {
    isProcessing,
    processingComplete,
    processingResults,
    startProcessing
  } = useAgentProcessing();

  if (downloadedFiles.length === 0) return null;

  const processPOFiles = async () => {
    console.log(`🚀 Starting to process ${downloadedFiles.length} files...`);
    
    try {
      toast({
        title: "Processing Started",
        description: `Processing ${downloadedFiles.length} PO file(s)...`,
      });

      // Use the agent processing system directly
      await startProcessing(downloadedFiles);
      
      if (processingResults) {
        console.log(`📊 Processing results:`, processingResults);
        onProcessingComplete(processingResults);
        
        toast({
          title: "Processing Complete",
          description: `Successfully processed ${downloadedFiles.length} file(s)`,
        });
      }

    } catch (error) {
      console.error(`❌ Processing error:`, error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process files",
        variant: "destructive"
      });
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

      <ProcessingStats 
        results={processingResults ? [processingResults] : []} 
        isProcessing={isProcessing} 
      />
    </div>
  );
};

export default ProcessingSection;
