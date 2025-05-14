import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Check, 
  File, 
  FileImage, 
  FileText, 
  FileX, 
  Upload, 
  X, 
  Table as TableIcon,
  Database,
  BarChart,
  Sparkles,
  AlertCircle,
  Settings,
  Layers,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  FileProcessingDialog, 
  ProcessingOptions, 
  PostProcessAction 
} from './FileProcessingDialog';
import { FileList } from './FileList';
import { useBulkFileUpload } from '@/hooks/useBulkFileUpload';

// Defines file status used in the component
type FileStatus = 'idle' | 'uploading' | 'success' | 'error';

// Interface for the uploaded file with status and progress
interface UploadedFile {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
  processed?: boolean;
}

const FileUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
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
          
          <div className="space-x-2">
            <Button 
              variant="outline" 
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload size={16} className="mr-2" />
              Select Files
            </Button>
            <Button 
              variant="outline"
              onClick={() => document.getElementById('folder-upload')?.click()}
            >
              <Layers size={16} className="mr-2" />
              Select Folder
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.csv"
              onChange={handleFileChange}
            />
            <input
              id="folder-upload"
              type="file"
              multiple
              className="hidden"
              data-directory=""
              // Using webkitdirectory as a boolean attribute
              webkitdirectory=""
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
              <div className="flex gap-2">
                {files.some(f => f.status === 'idle') && (
                  <Button size="sm" onClick={uploadAllFiles}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload All
                  </Button>
                )}
                {getUnprocessedFiles().length > 0 && (
                  <Button size="sm" variant="secondary" onClick={() => selectByType('data')}>
                    <TableIcon className="mr-2 h-4 w-4" />
                    Process Data Files
                  </Button>
                )}
                {getUnprocessedFiles().length > 0 && (
                  <Button size="sm" variant="secondary" onClick={() => selectByType('document')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Process Documents
                  </Button>
                )}
              </div>
            </div>
            
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
