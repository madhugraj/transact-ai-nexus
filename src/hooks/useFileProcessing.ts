
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FileStatus, UploadedFile } from '@/types/fileUpload';
import { PostProcessAction } from '@/types/processing';
import { useFileProcessingOptions } from './useFileProcessingOptions';
import { useFileTypeDetection } from './useFileTypeDetection';

export function useFileProcessing() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [currentAction, setCurrentAction] = useState<PostProcessAction>('table_extraction');
  const [processingComplete, setProcessingComplete] = useState(false);
  const { toast } = useToast();
  
  const { 
    processingOptions, 
    setProcessingOptions,
    setDefaultTableName,
    updateOcrSettings
  } = useFileProcessingOptions();
  
  const { isDocumentFile, isDataFile, detectFileTypes } = useFileTypeDetection();
  
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
  
  // Process file upload
  const uploadFile = (id: string) => {
    setFiles(files.map(file => {
      if (file.id === id) {
        return { ...file, status: 'uploading' as FileStatus, progress: 0 };
      }
      return file;
    }));
    
    // Simulate upload process
    const interval = setInterval(() => {
      setFiles(prevFiles => {
        const updatedFiles = prevFiles.map(file => {
          if (file.id === id && file.status === 'uploading') {
            const newProgress = file.progress + 10;
            
            if (newProgress >= 100) {
              clearInterval(interval);
              return { ...file, status: 'success' as FileStatus, progress: 100 };
            }
            
            return { ...file, progress: newProgress };
          }
          return file;
        });
        
        return updatedFiles;
      });
    }, 300);
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
  const processFiles = () => {
    // Simulate processing
    toast({
      title: "Processing started",
      description: `Processing ${selectedFileIds.length} files`,
    });
    
    // Mark files as processed
    setFiles(prev => prev.map(file => {
      if (selectedFileIds.includes(file.id)) {
        return { ...file, processed: true };
      }
      return file;
    }));
    
    // Simulate completion after a delay
    setTimeout(() => {
      toast({
        title: "Processing complete",
        description: `Files have been processed successfully.`,
      });
      
      // Show next steps workflow
      setProcessingComplete(true);
      
      // Store the table name in localStorage for other components to use
      if (currentAction === 'push_to_db' && processingOptions.databaseOptions?.tableName) {
        localStorage.setItem('lastProcessedTable', processingOptions.databaseOptions.tableName);
      }
    }, 2000);
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
    handleWorkflowComplete
  };
}
