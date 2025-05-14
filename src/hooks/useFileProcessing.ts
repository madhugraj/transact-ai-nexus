
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FileStatus, UploadedFile } from '@/types/fileUpload';
import { PostProcessAction } from '@/types/processing';
import { useFileProcessingOptions } from './useFileProcessingOptions';
import { useFileTypeDetection } from './useFileTypeDetection';
import * as api from '@/services/api';

export function useFileProcessing() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [currentAction, setCurrentAction] = useState<PostProcessAction>('table_extraction');
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const { toast } = useToast();
  
  const { 
    processingOptions, 
    setProcessingOptions,
    setDefaultTableName,
    updateOcrSettings
  } = useFileProcessingOptions();
  
  const { isDocumentFile, isDataFile, detectFileTypes } = useFileTypeDetection();
  
  // Poll for processing status when there's an active processingId
  useEffect(() => {
    let intervalId: number;
    
    if (processingId && isPolling) {
      intervalId = window.setInterval(async () => {
        const response = await api.getProcessingStatus(processingId);
        
        if (!response.success) {
          toast({
            title: "Error checking status",
            description: response.error,
            variant: "destructive",
          });
          setIsPolling(false);
          return;
        }
        
        const { status, message } = response.data!;
        
        if (status === 'completed') {
          toast({
            title: "Processing complete",
            description: message || "Files have been processed successfully.",
          });
          setIsPolling(false);
          setProcessingComplete(true);
          
          // Store the table name in localStorage for other components to use
          if (currentAction === 'push_to_db' && processingOptions.databaseOptions?.tableName) {
            localStorage.setItem('lastProcessedTable', processingOptions.databaseOptions.tableName);
          }
        } else if (status === 'failed') {
          toast({
            title: "Processing failed",
            description: message || "An error occurred during processing.",
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
  
  // Add files to the state
  const addFiles = (newFiles: File[]) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
    const validFiles = newFiles.filter(file => validTypes.includes(file.type));
    
    if (validFiles.length !== newFiles.length) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, images, Excel, and CSV files are allowed",
        variant: "destructive",
      });
    }
    
    const newUploadedFiles: UploadedFile[] = validFiles.map(file => ({
      id: `${file.name}-${Date.now()}`,
      file,
      status: 'idle' as FileStatus,
      progress: 0
    }));
    
    setFiles(prev => [...prev, ...newUploadedFiles]);
  };
  
  // Remove file from the list
  const removeFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
  };
  
  // Process file upload to backend
  const uploadFile = async (id: string) => {
    const fileToUpload = files.find(file => file.id === id);
    if (!fileToUpload) return;
    
    setFiles(files.map(file => {
      if (file.id === id) {
        return { ...file, status: 'uploading' as FileStatus, progress: 0 };
      }
      return file;
    }));
    
    // Set up progress tracking
    let progressTracker = 0;
    const progressInterval = setInterval(() => {
      progressTracker += 5;
      if (progressTracker <= 95) {
        setFiles(prevFiles => {
          return prevFiles.map(file => {
            if (file.id === id) {
              return { ...file, progress: progressTracker };
            }
            return file;
          });
        });
      }
    }, 200);
    
    try {
      const response = await api.uploadFile(fileToUpload.file);
      
      clearInterval(progressInterval);
      
      if (!response.success) {
        setFiles(prevFiles => {
          return prevFiles.map(file => {
            if (file.id === id) {
              return { ...file, status: 'error' as FileStatus, progress: 0, error: response.error };
            }
            return file;
          });
        });
        
        toast({
          title: "Upload failed",
          description: response.error,
          variant: "destructive",
        });
        return;
      }
      
      // Update file with backend ID
      setFiles(prevFiles => {
        return prevFiles.map(file => {
          if (file.id === id) {
            return { 
              ...file, 
              status: 'success' as FileStatus, 
              progress: 100,
              backendId: response.data!.fileId
            };
          }
          return file;
        });
      });
      
    } catch (error) {
      clearInterval(progressInterval);
      
      setFiles(prevFiles => {
        return prevFiles.map(file => {
          if (file.id === id) {
            return { 
              ...file, 
              status: 'error' as FileStatus, 
              progress: 0,
              error: error instanceof Error ? error.message : 'Upload failed'
            };
          }
          return file;
        });
      });
      
      toast({
        title: "Upload error",
        description: error instanceof Error ? error.message : 'Unknown error during upload',
        variant: "destructive",
      });
    }
  };
  
  // Start upload for all files
  const uploadAllFiles = () => {
    const idleFiles = files.filter(file => file.status === 'idle');
    
    if (idleFiles.length === 0) {
      toast({
        title: "No files to upload",
        description: "All files have been processed or are in progress",
      });
      return;
    }
    
    idleFiles.forEach(file => {
      uploadFile(file.id);
    });
    
    toast({
      title: "Upload started",
      description: `Uploading ${idleFiles.length} files`,
    });
  };

  // Select files for processing
  const selectFilesForProcessing = (fileIds: string[]) => {
    setSelectedFileIds(fileIds);
    
    // Set appropriate default action based on file types
    const selectedFiles = files.filter(file => fileIds.includes(file.id));
    const { allDocuments, allData } = detectFileTypes(selectedFiles);
    
    if (allDocuments) {
      setCurrentAction('table_extraction');
      // Enable OCR by default for scanned documents
      updateOcrSettings(true);
    } else if (allData) {
      setCurrentAction('combine_data');
      // Disable OCR for data files
      updateOcrSettings(false);
    } else {
      setCurrentAction('insights');
    }
    
    // Set default table name if pushing to DB
    if (selectedFiles.length === 1) {
      setDefaultTableName(selectedFiles[0].file.name);
    } else {
      setProcessingOptions(prev => ({
        ...prev,
        databaseOptions: {
          ...prev.databaseOptions,
          tableName: 'imported_data'
        }
      }));
    }
    
    return { currentAction, processingOptions };
  };

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
      
      // Mark files as being processed
      setFiles(prev => prev.map(file => {
        if (selectedFileIds.includes(file.id)) {
          return { ...file, processing: true };
        }
        return file;
      }));
      
    } catch (error) {
      toast({
        title: "Processing error",
        description: error instanceof Error ? error.message : 'Unknown error during processing',
        variant: "destructive",
      });
    }
  };

  // Group selection by file type
  const selectByType = (type: 'document' | 'data') => {
    const fileIds = files
      .filter(file => {
        if (file.status !== 'success') return false;
        return type === 'document' 
          ? isDocumentFile(file.file) 
          : isDataFile(file.file);
      })
      .map(file => file.id);
    
    if (fileIds.length === 0) {
      toast({
        title: "No files available",
        description: `No ${type} files are available for processing`,
      });
      return null;
    }
    
    return selectFilesForProcessing(fileIds);
  };

  // Get files that need processing (uploaded but not processed)
  const getUnprocessedFiles = () => {
    return files.filter(file => file.status === 'success' && !file.processed);
  };

  // Handle workflow completion
  const handleWorkflowComplete = () => {
    setProcessingComplete(false);
    setProcessingId(null);
  };

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
