
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PostProcessAction } from '@/types/processing';
import { useFileProcessingOptions } from './useFileProcessingOptions';
import { useFileState } from './useFileState';
import { useFileUpload } from './useFileUpload';
import { useFileSelection } from './useFileSelection';
import { useFileProcessingActions } from './useFileProcessingActions';

export function useFileProcessing() {
  const [currentAction, setCurrentAction] = useState<PostProcessAction>('table_extraction');
  const { toast } = useToast();
  
  const { 
    processingOptions, 
    setProcessingOptions,
    setDefaultTableName,
    updateOcrSettings
  } = useFileProcessingOptions();
  
  const {
    files,
    selectedFileIds,
    setSelectedFileIds,
    addFiles,
    removeFile,
    updateFileStatus,
    getUnprocessedFiles
  } = useFileState();
  
  const {
    uploadFile,
    uploadAllFiles
  } = useFileUpload(files, updateFileStatus);
  
  const {
    selectFilesForProcessing,
    selectByType,
    isDocumentFile,
    isDataFile
  } = useFileSelection(
    files, 
    setSelectedFileIds, 
    setCurrentAction, 
    updateOcrSettings, 
    setDefaultTableName,
    processingOptions
  );
  
  const {
    processingId,
    isPolling,
    setIsPolling,
    processingComplete,
    setProcessingComplete,
    processFiles,
    handleWorkflowComplete,
    getProcessedFileId
  } = useFileProcessingActions(files, selectedFileIds, currentAction, processingOptions);
  
  // Poll for processing status when there's an active processingId
  useEffect(() => {
    let intervalId: number;
    
    if (processingId && isPolling) {
      intervalId = window.setInterval(async () => {
        try {
          const response = await fetch(`/api/process/status/${processingId}`);
          const data = await response.json();
          
          if (data.status === 'completed') {
            toast({
              title: "Processing complete",
              description: data.message || "Files have been processed successfully.",
            });
            setIsPolling(false);
            setProcessingComplete(true);
            
            // Store the table name in localStorage for other components to use
            if (currentAction === 'push_to_db' && processingOptions.databaseOptions?.tableName) {
              localStorage.setItem('lastProcessedTable', processingOptions.databaseOptions.tableName);
            }
          } else if (data.status === 'failed') {
            toast({
              title: "Processing failed",
              description: data.message || "An error occurred during processing.",
              variant: "destructive",
            });
            setIsPolling(false);
          }
        } catch (error) {
          toast({
            title: "Error checking status",
            description: error instanceof Error ? error.message : "Failed to check processing status",
            variant: "destructive",
          });
          setIsPolling(false);
        }
      }, 2000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [processingId, isPolling, toast, currentAction, processingOptions]);

  return {
    files,
    selectedFileIds,
    currentAction,
    setCurrentAction,
    processingOptions,
    setProcessingOptions,
    processingComplete,
    addFiles,
    removeFile,
    uploadFile,
    uploadAllFiles,
    isDocumentFile,
    isDataFile,
    selectFilesForProcessing,
    processFiles,
    selectByType,
    getUnprocessedFiles,
    handleWorkflowComplete,
    processingId
  };
}
