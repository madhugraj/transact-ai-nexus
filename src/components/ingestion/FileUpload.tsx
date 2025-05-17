import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
import FileUploadActions from './FileUploadActions';
import CloudStorageConnector from './CloudStorageConnector';
import DocumentClassificationComponent from './DocumentClassification';
import { DocumentClassification } from '@/services/api/fileClassificationService';

const FileUpload = () => {
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [fileClassifications, setFileClassifications] = useState<Record<string, DocumentClassification>>({});
  const { toast } = useToast();
  
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

  // Handle file classification
  const handleClassify = (fileId: string, classification: DocumentClassification) => {
    setFileClassifications(prev => ({
      ...prev,
      [fileId]: classification
    }));
  };

  const handleBatchClassify = (classifications: Record<string, DocumentClassification>) => {
    setFileClassifications(classifications);
  };

  // Handle file processing with loading state and agent processing
  const handleProcessFiles = async () => {
    setIsLoading(true);
    setShowProcessingDialog(false);
    
    console.log("Processing files with agents:", files.filter(file => selectedFileIds.includes(file.id)));
    console.log("Current action:", currentAction);
    console.log("Processing options:", processingOptions);
    console.log("File classifications:", fileClassifications);

    try {
      // Use agent processing system instead of regular processing
      const selectedFiles = files.filter(file => selectedFileIds.includes(file.id));
      
      // Log available files for debugging
      console.log("Selected files for processing:", selectedFiles);
      
      // For table extraction, use the specialized table extraction function with the dynamic prompt
      if (currentAction === 'table_extraction' && selectedFiles.length > 0) {
        console.log("Using specialized table extraction for files with dynamic prompt");
        
        const results = [];
        let tableData = null;
        
        // Get the custom prompt if specified or use default
        const tableExtractionPrompt = processingOptions.ocrSettings?.customPrompt || DEFAULT_TABLE_EXTRACTION_PROMPT;
        
        console.log("Using table extraction prompt:", tableExtractionPrompt);
        
        let extractedFiles = [];
        
        for (const file of selectedFiles) {
          if (file.file && (file.file.type.startsWith('image/') || file.file.type === 'application/pdf')) {
            console.log(`Processing ${file.file.name} for table extraction`);
            
            const base64Image = await fileToBase64(file.file);
            const tableResponse = await extractTablesFromImageWithGemini(base64Image, file.file.type, tableExtractionPrompt);
            
            console.log(`Table extraction response for ${file.file.name}:`, tableResponse);
            
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
                
                console.log("Extracted table data:", tableData);
              }
            } else {
              results.push({
                fileName: file.file.name,
                error: tableResponse.error || "Failed to extract tables",
                success: false
              });
              
              console.error(`Failed to extract tables from ${file.file.name}:`, tableResponse.error);
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
          
          console.log("Setting processing results:", processedResults);
          
          // Process with agents
          await processWithAgents(selectedFiles, {
            ...processingOptions,
            useGemini: true,
            extractedResults: processedResults,
            fileClassifications
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
        useGemini: true, // Enable Gemini processing
        fileClassifications
      });
      
      console.log("Agent processing complete, results:", processingResults);
      
      toast({
        title: "Processing complete",
        description: "Your files have been processed successfully."
      });
    } catch (error) {
      console.error("Error processing files:", error);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Document Upload</h2>
        <p className="text-muted-foreground">
          Upload financial documents for processing. Supported formats: PDF, images, Excel, and CSV.
        </p>
      </div>
      
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
      
      {/* File upload tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="upload">Local Upload</TabsTrigger>
          <TabsTrigger value="cloud">Cloud Storage</TabsTrigger>
          <TabsTrigger value="classify">Classification</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="mt-0">
          {/* File drop zone */}
          <DropZone onFilesSelected={addFiles} />
          
          {isLoading ? (
            <Card className="shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-8 w-1/4" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : (
            files.length > 0 && !processingComplete && !agentsProcessingComplete && (
              <Card className="shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
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
                  
                  {/* Additional file upload actions */}
                  <FileUploadActions
                    files={files}
                    isLoading={isLoading}
                    handleProcessFiles={handleProcessFiles}
                    selectFilesForProcessing={selectFilesForProcessing}
                    selectByType={selectByType}
                    setShowProcessingDialog={setShowProcessingDialog}
                  />
                </CardContent>
              </Card>
            )
          )}
        </TabsContent>
        
        <TabsContent value="cloud" className="mt-0">
          <CloudStorageConnector onFilesSelected={addFiles} />
          
          {/* Show file list if there are files */}
          {files.length > 0 && !isLoading && (
            <Card className="shadow-sm mt-6">
              <CardContent className="p-6">
                <FileList 
                  files={files}
                  onRemove={removeFile}
                  onUpload={uploadFile}
                  onProcess={(id) => {
                    selectFilesForProcessing([id]);
                    setShowProcessingDialog(true);
                  }}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="classify" className="mt-0">
          <DocumentClassificationComponent 
            files={files}
            onClassify={handleClassify}
            onBatchClassify={handleBatchClassify}
          />
          
          {/* Process button for classified files */}
          {files.length > 0 && Object.keys(fileClassifications).length > 0 && (
            <div className="mt-4">
              <Button 
                onClick={() => {
                  // Select all classified files for processing
                  selectFilesForProcessing(Object.keys(fileClassifications));
                  setShowProcessingDialog(true);
                }}
                className="w-full"
              >
                Process Classified Documents
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

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
