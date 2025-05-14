
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FileStatus, UploadedFile } from '@/types/fileUpload';

export function useFileState() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
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

  // Update file status and progress
  const updateFileStatus = (id: string, status: FileStatus, progress: number = 0, error?: string, backendId?: string) => {
    setFiles(prevFiles => {
      return prevFiles.map(file => {
        if (file.id === id) {
          return { ...file, status, progress, error, backendId };
        }
        return file;
      });
    });
  };

  // Get unprocessed files
  const getUnprocessedFiles = () => {
    return files.filter(file => file.status === 'success' && !file.processed);
  };

  return {
    files,
    selectedFileIds,
    setSelectedFileIds,
    addFiles,
    removeFile,
    updateFileStatus,
    getUnprocessedFiles
  };
}
