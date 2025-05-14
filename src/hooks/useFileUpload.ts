
import { useToast } from '@/hooks/use-toast';
import { UploadedFile } from '@/types/fileUpload';
import * as api from '@/services/api';

export function useFileUpload(
  files: UploadedFile[],
  updateFileStatus: (id: string, status: 'idle' | 'uploading' | 'success' | 'error', progress?: number, error?: string, backendId?: string) => void
) {
  const { toast } = useToast();

  // Process file upload to backend
  const uploadFile = async (id: string) => {
    const fileToUpload = files.find(file => file.id === id);
    if (!fileToUpload) return;
    
    updateFileStatus(id, 'uploading', 0);
    
    // Set up progress tracking
    let progressTracker = 0;
    const progressInterval = setInterval(() => {
      progressTracker += 5;
      if (progressTracker <= 95) {
        updateFileStatus(id, 'uploading', progressTracker);
      }
    }, 200);
    
    try {
      const response = await api.uploadFile(fileToUpload.file);
      
      clearInterval(progressInterval);
      
      if (!response.success) {
        updateFileStatus(id, 'error', 0, response.error);
        
        toast({
          title: "Upload failed",
          description: response.error,
          variant: "destructive",
        });
        return;
      }
      
      // Update file with backend ID
      updateFileStatus(id, 'success', 100, undefined, response.data!.fileId);
      
    } catch (error) {
      clearInterval(progressInterval);
      
      updateFileStatus(id, 'error', 0, error instanceof Error ? error.message : 'Upload failed');
      
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

  return {
    uploadFile,
    uploadAllFiles
  };
}
