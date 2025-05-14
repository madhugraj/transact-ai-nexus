
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FileStatus, UploadedFile } from '@/types/fileUpload';

export const useBulkFileUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

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
      status: 'idle',
      progress: 0
    }));
    
    setFiles(prev => [...prev, ...newUploadedFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
  };

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

  return {
    files,
    addFiles,
    removeFile,
    uploadFile,
    uploadAllFiles,
    setFiles
  };
};
