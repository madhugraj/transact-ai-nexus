
import { useToast } from '@/hooks/use-toast';
import { UploadedFile } from '@/types/fileUpload';
import { PostProcessAction } from '@/types/processing';
import { useFileTypeDetection } from './useFileTypeDetection';

export function useFileSelection(
  files: UploadedFile[],
  setSelectedFileIds: (ids: string[]) => void,
  setCurrentAction: (action: PostProcessAction) => void,
  updateOcrSettings: (enabled: boolean) => void,
  setDefaultTableName: (name: string) => void,
  processingOptions: any
) {
  const { toast } = useToast();
  const { isDocumentFile, isDataFile, detectFileTypes } = useFileTypeDetection();
  
  // Select files for processing
  const selectFilesForProcessing = (fileIds: string[]) => {
    setSelectedFileIds(fileIds);
    
    // Set appropriate default action based on file types
    const selectedFiles = files.filter(file => fileIds.includes(file.id));
    const { allDocuments, allData } = detectFileTypes(selectedFiles);
    
    let action: PostProcessAction = 'insights';
    
    if (allDocuments) {
      action = 'table_extraction';
      // Enable OCR by default for scanned documents
      updateOcrSettings(true);
    } else if (allData) {
      action = 'combine_data';
      // Disable OCR for data files
      updateOcrSettings(false);
    }
    
    setCurrentAction(action);
    
    // Set default table name if pushing to DB
    if (selectedFiles.length === 1) {
      setDefaultTableName(selectedFiles[0].file.name);
    } else {
      setDefaultTableName('imported_data');
    }
    
    return { action, processingOptions };
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

  return {
    selectFilesForProcessing,
    selectByType,
    isDocumentFile,
    isDataFile
  };
}
