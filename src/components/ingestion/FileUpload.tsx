
import { useState, useRef, useEffect } from 'react';
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

// Defines file status used in the component
type FileStatus = 'idle' | 'uploading' | 'success' | 'error';

// Post-processing action for uploaded files
type PostProcessAction = 'table_extraction' | 'insights' | 'summary' | 'combine_data' | 'push_to_db';

// File processing options
interface ProcessingOptions {
  tableFormat?: {
    hasHeaders: boolean;
    headerRow?: number;
    skipRows?: number;
    delimiter?: string;
  };
  dataProcessing?: {
    normalizeData: boolean;
    removeEmptyRows: boolean;
    detectTypes: boolean;
  };
  databaseOptions?: {
    connection: string;
    tableName: string;
    createIfNotExists: boolean;
  };
}

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
                    
                    {uploadedFile.status === 'success' && !uploadedFile.processed && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs"
                        onClick={() => openProcessingDialog([uploadedFile.id])}
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
          </CardContent>
        </Card>
      )}

      {/* Processing dialog */}
      <Dialog open={showProcessingDialog} onOpenChange={setShowProcessingDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Process Files</DialogTitle>
            <DialogDescription>
              {selectedFileIds.length} file(s) selected for processing
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Select Action</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {isDocumentFile(files.find(f => f.id === selectedFileIds[0])?.file as File) && (
                    <>
                      <div
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer hover:bg-muted/50",
                          currentAction === 'table_extraction' && "border-primary bg-primary/5"
                        )}
                        onClick={() => setCurrentAction('table_extraction')}
                      >
                        <TableIcon className="h-8 w-8 mb-2 text-primary" />
                        <span className="text-sm font-medium">Table Extraction</span>
                      </div>
                      <div
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer hover:bg-muted/50",
                          currentAction === 'summary' && "border-primary bg-primary/5"
                        )}
                        onClick={() => setCurrentAction('summary')}
                      >
                        <FileText className="h-8 w-8 mb-2 text-orange-500" />
                        <span className="text-sm font-medium">Document Summary</span>
                      </div>
                    </>
                  )}

                  {isDataFile(files.find(f => f.id === selectedFileIds[0])?.file as File) && selectedFileIds.length > 1 && (
                    <div
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer hover:bg-muted/50",
                        currentAction === 'combine_data' && "border-primary bg-primary/5"
                      )}
                      onClick={() => setCurrentAction('combine_data')}
                    >
                      <Layers className="h-8 w-8 mb-2 text-blue-500" />
                      <span className="text-sm font-medium">Combine Data</span>
                    </div>
                  )}

                  <div
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer hover:bg-muted/50",
                      currentAction === 'insights' && "border-primary bg-primary/5"
                    )}
                    onClick={() => setCurrentAction('insights')}
                  >
                    <Sparkles className="h-8 w-8 mb-2 text-yellow-500" />
                    <span className="text-sm font-medium">Generate Insights</span>
                  </div>
                  
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer hover:bg-muted/50",
                      currentAction === 'push_to_db' && "border-primary bg-primary/5"
                    )}
                    onClick={() => setCurrentAction('push_to_db')}
                  >
                    <Database className="h-8 w-8 mb-2 text-green-500" />
                    <span className="text-sm font-medium">Push to Database</span>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              {/* Action-specific settings */}
              <Tabs defaultValue="settings">
                <TabsList>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="settings" className="space-y-4 py-4">
                  {/* Table Extraction Settings */}
                  {currentAction === 'table_extraction' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Table Headers</Label>
                          <Select 
                            value={processingOptions.tableFormat?.hasHeaders ? "yes" : "no"}
                            onValueChange={(val) => setProcessingOptions(prev => ({
                              ...prev,
                              tableFormat: {
                                ...prev.tableFormat,
                                hasHeaders: val === "yes"
                              }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">First row is header</SelectItem>
                              <SelectItem value="no">No headers in table</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {processingOptions.tableFormat?.hasHeaders && (
                          <div>
                            <Label>Header Row</Label>
                            <Input 
                              type="number" 
                              min="1" 
                              value={processingOptions.tableFormat.headerRow}
                              onChange={(e) => setProcessingOptions(prev => ({
                                ...prev,
                                tableFormat: {
                                  ...prev.tableFormat,
                                  headerRow: parseInt(e.target.value)
                                }
                              }))}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Skip Rows</Label>
                        <Input 
                          type="number" 
                          min="0"
                          value={processingOptions.tableFormat?.skipRows}
                          onChange={(e) => setProcessingOptions(prev => ({
                            ...prev,
                            tableFormat: {
                              ...prev.tableFormat,
                              skipRows: parseInt(e.target.value)
                            }
                          }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Number of rows to skip from the top of the document
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="normalize-data"
                          checked={processingOptions.dataProcessing?.normalizeData}
                          onCheckedChange={(checked) => setProcessingOptions(prev => ({
                            ...prev,
                            dataProcessing: {
                              ...prev.dataProcessing,
                              normalizeData: checked === true
                            }
                          }))}
                        />
                        <label htmlFor="normalize-data" className="text-sm">
                          Normalize extracted data
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="detect-types"
                          checked={processingOptions.dataProcessing?.detectTypes}
                          onCheckedChange={(checked) => setProcessingOptions(prev => ({
                            ...prev,
                            dataProcessing: {
                              ...prev.dataProcessing,
                              detectTypes: checked === true
                            }
                          }))}
                        />
                        <label htmlFor="detect-types" className="text-sm">
                          Auto-detect data types
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {/* Data Combining Settings */}
                  {currentAction === 'combine_data' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Combine Method</Label>
                        <Select defaultValue="append">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="append">Append (stack vertically)</SelectItem>
                            <SelectItem value="merge">Merge on common columns</SelectItem>
                            <SelectItem value="union">Union (distinct rows)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Match Columns</Label>
                        <Select defaultValue="auto">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto-detect columns</SelectItem>
                            <SelectItem value="name">Match by column name</SelectItem>
                            <SelectItem value="position">Match by position</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remove-empty-rows" defaultChecked />
                        <label htmlFor="remove-empty-rows" className="text-sm">
                          Remove empty rows
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox id="normalize-combined-data" defaultChecked />
                        <label htmlFor="normalize-combined-data" className="text-sm">
                          Normalize column names across files
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {/* Database Push Settings */}
                  {currentAction === 'push_to_db' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Database Connection</Label>
                        <Select 
                          value={processingOptions.databaseOptions?.connection}
                          onValueChange={(val) => setProcessingOptions(prev => ({
                            ...prev,
                            databaseOptions: {
                              ...prev.databaseOptions,
                              connection: val
                            }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ERP Database">ERP Database (PostgreSQL)</SelectItem>
                            <SelectItem value="SAP HANA">SAP HANA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Table Name</Label>
                        <Input 
                          placeholder="Enter table name" 
                          value={processingOptions.databaseOptions?.tableName}
                          onChange={(e) => setProcessingOptions(prev => ({
                            ...prev,
                            databaseOptions: {
                              ...prev.databaseOptions,
                              tableName: e.target.value
                            }
                          }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Name of the table to store the data
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="create-table"
                          checked={processingOptions.databaseOptions?.createIfNotExists}
                          onCheckedChange={(checked) => setProcessingOptions(prev => ({
                            ...prev,
                            databaseOptions: {
                              ...prev.databaseOptions,
                              createIfNotExists: checked === true
                            }
                          }))}
                        />
                        <label htmlFor="create-table" className="text-sm">
                          Create table if it doesn't exist
                        </label>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Insert Method</Label>
                        <Select defaultValue="insert">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="insert">Insert new rows</SelectItem>
                            <SelectItem value="upsert">Upsert (update if exists)</SelectItem>
                            <SelectItem value="replace">Replace table contents</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  
                  {/* Insight Settings */}
                  {currentAction === 'insights' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Analysis Type</Label>
                        <Select defaultValue="standard">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard Analysis</SelectItem>
                            <SelectItem value="financial">Financial Analysis</SelectItem>
                            <SelectItem value="detailed">Detailed Breakdown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Key Metrics</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="metric-amounts" defaultChecked />
                            <label htmlFor="metric-amounts" className="text-sm">Amount Analysis</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="metric-dates" defaultChecked />
                            <label htmlFor="metric-dates" className="text-sm">Date Patterns</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="metric-vendors" defaultChecked />
                            <label htmlFor="metric-vendors" className="text-sm">Vendor Analysis</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="metric-category" defaultChecked />
                            <label htmlFor="metric-category" className="text-sm">Category Detection</label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Visualization Options</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="viz-charts" defaultChecked />
                            <label htmlFor="viz-charts" className="text-sm">Generate Charts</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="viz-summary" defaultChecked />
                            <label htmlFor="viz-summary" className="text-sm">Summary Tables</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Document Summary Settings */}
                  {currentAction === 'summary' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Summary Type</Label>
                        <Select defaultValue="comprehensive">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="brief">Brief Overview</SelectItem>
                            <SelectItem value="comprehensive">Comprehensive</SelectItem>
                            <SelectItem value="financial">Financial Focus</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Include Elements</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="elem-metadata" defaultChecked />
                            <label htmlFor="elem-metadata" className="text-sm">Document Metadata</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="elem-entities" defaultChecked />
                            <label htmlFor="elem-entities" className="text-sm">Named Entities</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="elem-tables" defaultChecked />
                            <label htmlFor="elem-tables" className="text-sm">Tables</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="elem-amounts" defaultChecked />
                            <label htmlFor="elem-amounts" className="text-sm">Monetary Amounts</label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox id="extract-key-terms" defaultChecked />
                        <label htmlFor="extract-key-terms" className="text-sm">
                          Extract key terms and concepts
                        </label>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="preview">
                  <div className="p-6 text-center text-muted-foreground border rounded-md flex flex-col items-center justify-center h-40 mt-2">
                    <Settings className="h-8 w-8 mb-2 opacity-50" />
                    <p>Preview will be generated after processing begins</p>
                  </div>
                </TabsContent>
              </Tabs>
              
              {/* Next Steps Workflow */}
              <div className="bg-muted p-4 rounded-md mt-4">
                <h4 className="text-sm font-medium mb-2">Processing Workflow</h4>
                <div className="flex items-center text-sm">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                      1
                    </div>
                    <span className="text-xs mt-1">Process</span>
                  </div>
                  <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center">
                      2
                    </div>
                    <span className="text-xs mt-1">Dashboard</span>
                  </div>
                  <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center">
                      3
                    </div>
                    <span className="text-xs mt-1">AI Assistant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={processFiles}>
              Start Processing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileUpload;
