
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, File, FileImage, FileText, FileX, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

// Defines file status used in the component
type FileStatus = 'idle' | 'uploading' | 'success' | 'error';

// Interface for the uploaded file with status and progress
interface UploadedFile {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
}

const FileUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      addFiles(Array.from(selectedFiles));
    }
  };
  
  // Handle drag and drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  // Add files to the state
  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
      return validTypes.includes(file.type);
    });
    
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
        return <Check size={18} className="text-status-approved" />;
      case 'error':
        return <FileX size={18} className="text-status-rejected" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Document Upload</h1>
        <p className="text-muted-foreground">
          Upload financial documents for processing. Supported formats: PDF, images, Excel, and CSV.
        </p>
      </div>
      
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center",
          isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center">
          <Upload size={48} className={cn(
            "mb-4 text-muted-foreground",
            isDragOver && "text-primary"
          )} />
          
          <h3 className="text-lg font-medium mb-2">
            Drop files here or click to upload
          </h3>
          <p className="text-muted-foreground mb-4">
            PDF, JPG, PNG, Excel, and CSV files are supported
          </p>
          
          <div>
            <Button 
              variant="outline" 
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload size={16} className="mr-2" />
              Select Files
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.csv"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>
      
      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between mb-4">
              <h3 className="font-medium">Selected Files ({files.length})</h3>
              {files.some(f => f.status === 'idle') && (
                <Button size="sm" onClick={uploadAllFiles}>
                  Upload All
                </Button>
              )}
            </div>
            
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
                          onClick={() => uploadFile(uploadedFile.id)}
                        >
                          <Upload size={16} />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8" 
                          onClick={() => removeFile(uploadedFile.id)}
                        >
                          <X size={16} />
                        </Button>
                      </>
                    )}
                    
                    {uploadedFile.status === 'success' && (
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUpload;
