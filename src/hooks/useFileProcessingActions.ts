
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
      
      // Save processed files to localStorage for AI Assistant
      try {
        // Get existing processed files or initialize empty array
        const existingFiles = localStorage.getItem('processedFiles');
        const processedFiles = existingFiles ? JSON.parse(existingFiles) : [];
        
        // Add newly processed files with timestamp
        const newProcessedFiles = selectedFiles.map(file => ({
          ...file,
          extractedAt: new Date().toISOString(),
          processingId: response.data?.processingId
        }));
        
        // Update localStorage with combined array
        localStorage.setItem('processedFiles', JSON.stringify([...processedFiles, ...newProcessedFiles]));
        
        // Dispatch event to notify components that new documents are processed
        window.dispatchEvent(new CustomEvent('documentProcessed'));
      } catch (error) {
        console.error("Error saving processed files to localStorage:", error);
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
  const handleWorkflowComplete = (results?: any) => {
    setProcessingComplete(false);
    setProcessingId(null);
    
    // If we have table results, store them in localStorage for AI Assistant
    if (results && results.tables) {
      try {
        // Get existing processed tables or initialize empty array
        const existingTables = localStorage.getItem('processedTables');
        const processedTables = existingTables ? JSON.parse(existingTables) : [];
        
        // Add newly processed tables with timestamp
        const newProcessedTables = Array.isArray(results.tables) 
          ? results.tables.map((table: any) => ({
              ...table,
              extractedAt: new Date().toISOString(),
              processingId
            }))
          : [{
              ...results.tables,
              id: `table-${Date.now()}`,
              extractedAt: new Date().toISOString(),
              processingId
            }];
        
        // Update localStorage with combined array
        localStorage.setItem('processedTables', JSON.stringify([...processedTables, ...newProcessedTables]));
        
        // Dispatch event to notify components that new tables are processed
        window.dispatchEvent(new CustomEvent('documentProcessed'));
      } catch (error) {
        console.error("Error saving processed tables to localStorage:", error);
      }
    }
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
