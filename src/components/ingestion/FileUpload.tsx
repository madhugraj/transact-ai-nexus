
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useFileProcessing } from '@/hooks/useFileProcessing';
import { FileProcessingDialog } from './dialog/FileProcessingDialog';
import { FileList } from './FileList';
import DropZone from './DropZone';
import FileActions from './FileActions';
import PostProcessingWorkflow from './PostProcessingWorkflow';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgentProcessing } from '@/hooks/useAgentProcessing';
import { useToast } from '@/hooks/use-toast';
import { fileToBase64, extractTablesFromImageWithGemini, DEFAULT_TABLE_EXTRACTION_PROMPT } from '@/services/api';
import CloudStorageConnector from './CloudStorageConnector';
import DocumentClassificationComponent from './DocumentClassificationComponent';
import { DocumentClassificationType } from '@/types/cloudStorage';

const FileUpload = () => {
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [classificationMode, setClassificationMode] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [classifiedFiles, setClassifiedFiles] = useState<{id: string, file: File, documentType: DocumentClassificationType}[]>([]);
  const { toast } = useToast();
  
  // Use file processing hook
  const {
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
    handleWorkflowComplete,
    processingId
  } = useFileProcessing();

  // Add agent processing system
  const {
    processFiles: processWithAgents,
    processingResults,
    processingComplete: agentsProcessingComplete,
    resetProcessing: resetAgentProcessing
  } = useAgentProcessing();

  // Handle classification completion
  const handleClassificationComplete = (classifiedFiles: {id: string, file: File, documentType: DocumentClassificationType}[]) => {
    setClassifiedFiles(classifiedFiles);
    setClassificationMode(false);
    
    // Select these files for processing
    selectFilesForProcessing(classifiedFiles.map(f => f.id));
    
    // Set appropriate action based on document type
    if (classifiedFiles.length > 0) {
      const firstType = classifiedFiles[0].documentType;
      
      // If all files are the same type
      if (classifiedFiles.every(f => f.documentType === firstType)) {
        if (['invoice', 'purchase_order', 'bill', 'receipt'].includes(firstType)) {
          setCurrentAction('table_extraction');
        } else if (['email', 'contract'].includes(firstType)) {
          setCurrentAction('summary');
        } else {
          setCurrentAction('insights');
        }
      } else {
        // Mixed document types
        setCurrentAction('table_extraction');
      }
    }
    
    // Start processing directly if auto-sync is enabled
    if (autoSync) {
      handleProcessFiles();
    }
  };

  // Auto-upload and process files when auto-sync is enabled
  useEffect(() => {
    if (autoSync && files.some(f => f.status === 'idle')) {
      uploadAllFiles();
    }
  }, [files, autoSync]);

  // Handle file processing with loading state and agent processing
  const handleProcessFiles = async () => {
    setIsLoading(true);
    setShowProcessingDialog(false);
    
    try {
      // Use agent processing system instead of regular processing
      const selectedFiles = files.filter(file => selectedFileIds.includes(file.id));
      
      // For table extraction, use the specialized table extraction function with the dynamic prompt
      if (currentAction === 'table_extraction' && selectedFiles.length > 0) {
        const results = [];
        let tableData = null;
        
        // Get the custom prompt if specified or use default
        const tableExtractionPrompt = processingOptions.ocrSettings?.customPrompt || DEFAULT_TABLE_EXTRACTION_PROMPT;
        
        let extractedFiles = [];
        
        for (const file of selectedFiles) {
          if (file.file && (file.file.type.startsWith('image/') || file.file.type === 'application/pdf')) {
            const base64Image = await fileToBase64(file.file);
            const tableResponse = await extractTablesFromImageWithGemini(base64Image, file.file.type, tableExtractionPrompt);
            
            if (tableResponse.success && tableResponse.data) {
              extractedFiles.push(file.file);
              
              results.push({
                fileName: file.file.name,
                extractedTables: tableResponse.data.tables,
                success: true
              });
              
              if (tableResponse.data.tables && tableResponse.data.tables.length > 0) {
                tableData = {
                  headers: tableResponse.data.tables[0].headers,
                  rows: tableResponse.data.tables[0].rows,
                  metadata: {
                    title: tableResponse.data.tables[0].title || `Table from ${file.file.name}`,
                    sourceFile: file.file.name,
                    totalRows: tableResponse.data.tables[0].rows.length
                  }
                };
              }
            } else {
              results.push({
                fileName: file.file.name,
                error: tableResponse.error || "Failed to extract tables",
                success: false
              });
            }
          }
        }
        
        if (results.length > 0) {
          setIsLoading(false);
          
          // Set processing results
          const processedResults = {
            fileObjects: selectedFiles.map(f => f.file),
            tableData,
            extractedTables: tableData ? [{ 
              headers: tableData.headers, 
              rows: tableData.rows,
              title: tableData.metadata.title
            }] : [],
            results,
            extractionComplete: true,
            processingComplete: true
          };
          
          // Process with agents
          await processWithAgents(selectedFiles, {
            ...processingOptions,
            useGemini: true,
            extractedResults: processedResults
          });
          
          toast({
            title: "Table extraction complete",
            description: `Successfully processed ${selectedFiles.length} file(s)`
          });
          
          return;
        }
      }
      
      // Process with agents for other actions
      await processWithAgents(selectedFiles, {
        ...processingOptions,
        useGemini: true // Enable Gemini processing
      });
      
      toast({
        title: "Processing complete",
        description: "Your files have been processed successfully."
      });
    } catch (error) {
      toast({
        title: "Processing error",
        description: error instanceof Error ? error.message : "An unknown error occurred during processing",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Find the processed file for the current processing
  const getProcessedFileId = () => {
    if (!selectedFileIds.length) return undefined;
    
    const selectedFile = files.find(file => selectedFileIds.includes(file.id));
    return selectedFile?.backendId;
  };

  // Handle files from cloud storage
  const handleCloudFilesSelected = (cloudFiles: File[]) => {
    addFiles(cloudFiles);
    setActiveTab('upload');
    
    if (cloudFiles.length > 0) {
      toast({
        title: "Files imported",
        description: `Successfully imported ${cloudFiles.length} files from cloud storage`,
      });
      
      // Auto process if enabled
      if (autoSync && cloudFiles.length > 0) {
        // Start upload process
        uploadAllFiles();
      }
    }
  };

  // Start classification workflow
  const startClassification = () => {
    if (files.length === 0) {
      toast({
        title: "No files to classify",
        description: "Please upload files first",
        variant: "destructive"
      });
      return;
    }
    
    setClassificationMode(true);
    setClassifiedFiles(files.map(f => ({
      id: f.id,
      file: f.file,
      documentType: 'other'
    })));
  };

  return (
    <div className="space-y-4">
      {/* Post-processing workflow */}
      {(processingComplete || agentsProcessingComplete) && processingResults && (
        <PostProcessingWorkflow
          tableName={processingOptions.databaseOptions?.tableName}
          processingType={currentAction}
          onClose={agentsProcessingComplete ? resetAgentProcessing : handleWorkflowComplete}
          processingId={processingId || undefined}
          fileId={getProcessedFileId()}
          processingResults={processingResults}
        />
      )}
      
      {/* Classification mode */}
      {classificationMode ? (
        <DocumentClassificationComponent 
          files={classifiedFiles}
          onClassificationComplete={handleClassificationComplete}
        />
      ) : (
        <div className="space-y-4">
          {/* Upload tabs */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="upload">Local Upload</TabsTrigger>
                    <TabsTrigger value="cloud">Cloud Storage</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-sync"
                    checked={autoSync}
                    onCheckedChange={setAutoSync}
                  />
                  <Label htmlFor="auto-sync">Auto Sync</Label>
                </div>
              </div>
              
              <TabsContent value="upload" className="mt-0 pt-0">
                <DropZone onFilesSelected={addFiles} />
              </TabsContent>
              
              <TabsContent value="cloud" className="mt-0 pt-0">
                <CloudStorageConnector onFilesSelected={handleCloudFilesSelected} />
              </TabsContent>
            </CardContent>
          </Card>

          {/* Files list and actions */}
          {isLoading ? (
            <Card className="shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-8 w-[120px]" />
                  <Skeleton className="h-8 w-[100px]" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : (
            files.length > 0 && !processingComplete && !agentsProcessingComplete && (
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  {/* File actions */}
                  <FileActions
                    files={files}
                    uploadAllFiles={uploadAllFiles}
                    onProcessDocuments={() => {
                      const result = selectByType('document');
                      if (result) setShowProcessingDialog(true);
                    }}
                    onProcessDataFiles={() => {
                      const result = selectByType('data');
                      if (result) setShowProcessingDialog(true);
                    }}
                  />
                  
                  {/* File list */}
                  <FileList 
                    files={files}
                    onRemove={removeFile}
                    onUpload={uploadFile}
                    onProcess={(id) => {
                      selectFilesForProcessing([id]);
                      setShowProcessingDialog(true);
                    }}
                  />
                  
                  {/* Classification button */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button 
                      onClick={startClassification}
                      disabled={isLoading || files.length === 0}
                      className="bg-blue-600 hover:bg-blue-700 transition-all duration-200"
                    >
                      Classify Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
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
        onProcess={handleProcessFiles}
        isDocumentFile={isDocumentFile}
        isDataFile={isDataFile}
      />
    </div>
  );
};

export default FileUpload;
