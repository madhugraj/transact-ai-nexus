
import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Upload, FileText, FileImage, File } from 'lucide-react';
import { UploadedFile, FileStatus } from '@/types/fileUpload';

interface FileListProps {
  files: UploadedFile[];
  onRemove: (id: string) => void;
  onUpload: (id: string) => void;
  onProcess: (id: string) => void;
}

export const FileList: React.FC<FileListProps> = ({ files, onRemove, onUpload, onProcess }) => {
  // Get appropriate icon based on file type
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage size={20} className="text-blue-500" />;
    } else if (file.type === 'application/pdf') {
      return <FileText size={20} className="text-red-500" />;
    } else if (file.type.includes('excel') || file.type.includes('spreadsheet') || file.type === 'text/csv') {
      return <FileText size={20} className="text-green-500" />;
    }
    return <File size={20} className="text-gray-500" />;
  };
  
  // Get status icon
  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case 'uploading':
        return null;
      case 'success':
        return <span className="text-green-600">✓</span>;
      case 'error':
        return <span className="text-red-600">✗</span>;
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-3">
      {files.map((uploadedFile) => (
        <div key={uploadedFile.id} className="flex items-center justify-between border rounded-md p-3">
          <div className="flex items-center gap-3 flex-1">
            {getFileIcon(uploadedFile.file)}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium truncate max-w-[200px]">
                  {uploadedFile.file.name}
                </p>
                {getStatusIcon(uploadedFile.status)}
              </div>
              <p className="text-xs text-muted-foreground">
                {(uploadedFile.file.size / 1024).toFixed(1)} KB
              </p>
              
              {uploadedFile.status === 'uploading' && (
                <Progress value={uploadedFile.progress} className="mt-2 h-1" />
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {uploadedFile.status === 'idle' && (
              <>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8" 
                  onClick={() => onUpload(uploadedFile.id)}
                >
                  <Upload size={16} />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8" 
                  onClick={() => onRemove(uploadedFile.id)}
                >
                  <X size={16} />
                </Button>
              </>
            )}
            
            {uploadedFile.status === 'success' && !uploadedFile.processed && (
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                onClick={() => onProcess(uploadedFile.id)}
              >
                Process
              </Button>
            )}
            
            {uploadedFile.status === 'success' && uploadedFile.processed && (
              <Button size="sm" variant="outline" className="text-xs">
                View
              </Button>
            )}
            
            {uploadedFile.status === 'error' && (
              <Button size="sm" variant="outline" className="text-xs">
                Retry
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
