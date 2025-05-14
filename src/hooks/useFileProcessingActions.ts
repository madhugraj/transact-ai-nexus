
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UploadedFile } from '@/types/fileUpload';
import { ProcessingOptions, PostProcessAction } from '@/types/processing';
import * as api from '@/services/api';

export function useFileProcessingActions(
  files: UploadedFile[],
  selectedFileIds: string[],
  currentAction: PostProcessAction,
  processingOptions: ProcessingOptions
) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const { toast } = useToast();

  // Process the selected files with the chosen action
  const processFiles = async () => {
    // Get backend file IDs for selected files
    const selectedFiles = files.filter(file => selectedFileIds.includes(file.id));
    const backendFileIds = selectedFiles
      .filter(file => file.backendId)
      .map(file => file.backendId as string);
    
    if (backendFileIds.length === 0) {
      toast({
        title: "No files ready for processing",
        description: "Please wait for files to finish uploading.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Processing started",
      description: `Processing ${backendFileIds.length} files`,
    });
    
    try {
      const response = await api.processFile(backendFileIds, currentAction, processingOptions);
      
      if (!response.success) {
        toast({
          title: "Processing failed",
          description: response.error,
          variant: "destructive",
        });
        return;
      }
      
      // Start polling for status
      setProcessingId(response.data!.processingId);
      setIsPolling(true);
      
    } catch (error) {
      toast({
        title: "Processing error",
        description: error instanceof Error ? error.message : 'Unknown error during processing',
        variant: "destructive",
      });
    }
  };

  // Handle workflow completion
  const handleWorkflowComplete = () => {
    setProcessingComplete(false);
    setProcessingId(null);
  };

  // Get the processed file ID for the current processing
  const getProcessedFileId = () => {
    if (!selectedFileIds.length) return undefined;
    
    const selectedFile = files.find(file => selectedFileIds.includes(file.id));
    return selectedFile?.backendId;
  };

  return {
    processingId,
    isPolling,
    setIsPolling,
    processingComplete,
    setProcessingComplete,
    processFiles,
    handleWorkflowComplete,
    getProcessedFileId
  };
}
