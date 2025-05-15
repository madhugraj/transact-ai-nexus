
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UploadedFile } from '@/types/fileUpload';
import { ProcessingOptions, PostProcessAction } from '@/types/processing';
import * as api from '@/services/api';
import { saveProcessedFiles, saveProcessedTables } from '@/utils/documentStorage';

export function useFileProcessingActions(
  files: UploadedFile[],
  selectedFileIds: string[],
  currentAction: PostProcessAction,
  processingOptions: ProcessingOptions
) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingResults, setProcessingResults] = useState<any>(null);
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
      
      // Save the actual file objects to pass along to other components
      const fileObjects = selectedFiles.map(f => f.file);
      setProcessingResults({
        ...response.data,
        fileObjects,
        processingId: response.data?.processingId
      });
      
      // Save processed files to localStorage using our utility function
      saveProcessedFiles(selectedFiles, response.data?.processingId);
      
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
    
    const resultsToUse = results || processingResults;
    
    // If we have table results, store them in localStorage using our utility function
    if (resultsToUse) {
      console.log("Processing results to save:", resultsToUse);
      
      if (resultsToUse.tables) {
        console.log("Saving tables to localStorage:", resultsToUse.tables);
        saveProcessedTables(
          Array.isArray(resultsToUse.tables) ? resultsToUse.tables : [resultsToUse.tables], 
          processingId || undefined
        );
      }
      
      // Save extracted tables if available
      if (resultsToUse.extractedTables && resultsToUse.extractedTables.length > 0) {
        console.log("Saving extracted tables to localStorage:", resultsToUse.extractedTables);
        saveProcessedTables(resultsToUse.extractedTables, processingId || undefined);
      }
      
      // Save table data directly if available
      if (resultsToUse.tableData) {
        console.log("Saving table data to localStorage:", resultsToUse.tableData);
        const tableDataToSave = {
          id: `table-data-${Date.now()}`,
          title: 'Extracted Table Data',
          name: 'Extracted Table Data',
          ...resultsToUse.tableData,
        };
        saveProcessedTables([tableDataToSave], processingId || undefined);
      }
    }
    
    setProcessingResults(null);
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
    getProcessedFileId,
    processingResults
  };
}
