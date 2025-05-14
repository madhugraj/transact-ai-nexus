
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  FileProcessingDialog, 
  ProcessingOptions, 
  PostProcessAction 
} from './FileProcessingDialog';
import { FileList } from './FileList';
import DropZone from './DropZone';
import FileActions from './FileActions';
import { UploadedFile, FileStatus } from '@/types/fileUpload';

const FileUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [currentAction, setCurrentAction] = useState<PostProcessAction>('table_extraction');
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    tableFormat: {
      hasHeaders: true,
      headerRow: 1,
      skipRows: 0,
      delimiter: 'auto',
    },
    dataProcessing: {
      normalizeData: true,
      removeEmptyRows: true,
      detectTypes: true,
    },
    databaseOptions: {
      connection: 'ERP Database',
      tableName: '',
      createIfNotExists: true,
    }
  });
  const { toast } = useToast();
  
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

  // Determine if file is a document (PDF/image) or data file (CSV/Excel)
  const isDocumentFile = (file: File) => {
    return file.type === 'application/pdf' || file.type.startsWith('image/');
  };

  // Determine if file is a data file (CSV/Excel)
  const isDataFile = (file: File) => {
    return file.type.includes('excel') || file.type.includes('spreadsheet') || file.type === 'text/csv';
  };

  // Open processing dialog for selected files
  const openProcessingDialog = (fileIds: string[]) => {
    setSelectedFileIds(fileIds);
    
    // Set appropriate default action based on file types
    const selectedFiles = files.filter(file => fileIds.includes(file.id));
    const allDocuments = selectedFiles.every(file => isDocumentFile(file.file));
    const allData = selectedFiles.every(file => isDataFile(file.file));
    
    if (allDocuments) {
      setCurrentAction('table_extraction');
    } else if (allData) {
      setCurrentAction('combine_data');
    } else {
      setCurrentAction('insights');
    }
    
    // Set default table name if pushing to DB
    if (selectedFiles.length === 1) {
      const fileName = selectedFiles[0].file.name.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
      setProcessingOptions(prev => ({
        ...prev,
        databaseOptions: {
          ...prev.databaseOptions,
          tableName: fileName
        }
      }));
    } else {
      setProcessingOptions(prev => ({
        ...prev,
        databaseOptions: {
          ...prev.databaseOptions,
          tableName: 'imported_data'
        }
      }));
    }
    
    setShowProcessingDialog(true);
  };

  // Process the selected files with the chosen action
  const processFiles = () => {
    // Simulate processing
    toast({
      title: "Processing started",
      description: `Processing ${selectedFileIds.length} files with ${getActionName(currentAction)}`,
    });
    
    // Mark files as processed
    setFiles(prev => prev.map(file => {
      if (selectedFileIds.includes(file.id)) {
        return { ...file, processed: true };
      }
      return file;
    }));
    
    // Close the dialog
    setShowProcessingDialog(false);
    
    // Simulate completion after a delay
    setTimeout(() => {
      toast({
        title: "Processing complete",
        description: `Files have been processed successfully. ${
          currentAction === 'push_to_db' 
            ? `Data is available in the ${processingOptions.databaseOptions?.tableName} table.` 
            : 'Results are available in the Dashboard.'
        }`,
      });
    }, 2000);
  };

  // Helper to get friendly name for actions
  const getActionName = (action: PostProcessAction): string => {
    switch (action) {
      case 'table_extraction': return 'Table Extraction';
      case 'insights': return 'Generate Insights';
      case 'summary': return 'Document Summary';
      case 'combine_data': return 'Combine Data';
      case 'push_to_db': return 'Push to Database';
      default: return action;
    }
  };

  // Get files that need processing (uploaded but not processed)
  const getUnprocessedFiles = () => {
    return files.filter(file => file.status === 'success' && !file.processed);
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
      return;
    }
    
    openProcessingDialog(fileIds);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Document Upload</h1>
        <p className="text-muted-foreground">
          Upload financial documents for processing. Supported formats: PDF, images, Excel, and CSV.
        </p>
      </div>
      
      {/* File drop zone */}
      <DropZone onFilesSelected={addFiles} />
      
      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            {/* File actions */}
            <FileActions
              files={files}
              uploadAllFiles={uploadAllFiles}
              onProcessDocuments={() => selectByType('document')}
              onProcessDataFiles={() => selectByType('data')}
            />
            
            {/* File list */}
            <FileList 
              files={files}
              onRemove={removeFile}
              onUpload={uploadFile}
              onProcess={(id) => openProcessingDialog([id])}
            />
          </CardContent>
        </Card>
      )}

      {/* Processing dialog */}
      <FileProcessingDialog
        open={showProcessingDialog}
        onOpenChange={setShowProcessingDialog}
        selectedFileIds={selectedFileIds}
        files={files}
        currentAction={currentAction}
        setCurrentAction={setCurrentAction}
        processingOptions={processingOptions}
        setProcessingOptions={setProcessingOptions}
        onProcess={processFiles}
      />
    </div>
  );
};

export default FileUpload;
