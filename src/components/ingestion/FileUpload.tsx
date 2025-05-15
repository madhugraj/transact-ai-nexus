import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useFileProcessing } from '@/hooks/useFileProcessing';
import { FileProcessingDialog } from './dialog/FileProcessingDialog';
import { FileList } from './FileList';
import DropZone from './DropZone';
import FileActions from './FileActions';
import PostProcessingWorkflow from './PostProcessingWorkflow';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgentProcessing } from '@/hooks/useAgentProcessing';
import { useToast } from '@/hooks/use-toast';
import { fileToBase64, extractTablesFromImageWithGemini } from '@/services/api';

const FileUpload = () => {
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  // Open processing dialog for selected files
  const openProcessingDialog = (fileIds: string[]) => {
    selectFilesForProcessing(fileIds);
    setShowProcessingDialog(true);
  };

  // Handle file processing with loading state and agent processing
  const handleProcessFiles = async () => {
    setIsLoading(true);
    setShowProcessingDialog(false);
    
    console.log("Processing files with agents:", files.filter(file => selectedFileIds.includes(file.id)));
    console.log("Current action:", currentAction);
    console.log("Processing options:", processingOptions);

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
        const tableExtractionPrompt = processingOptions.ocrSettings?.customPrompt || 
        `You're an OCR assistant. Read this scanned document image and extract clean, structured text.
        You are also an expert in extracting tables from scanned images.
        If the image has Checks, Mention that it is a check image and extract the values accordingly.
        - Give appropriate title for the image according to the type of image.
        Instructions:
        - Extract all clear tabular structures from the image.
        - Extract all possible tabular structures with data from the image
        - Extract the Headings of the table {extracted heading}
        - Avoid any logos or text not part of a structured table.
        - Output JSON only in the format:

        \`\`\`json
        {
          "tables": [
            {
              "title": "extracted heading",
              "headers": ["Column A", "Column B"],
              "rows": [
                ["value1", "value2"],
                ...
              ]
            }
          ]
        }
        \`\`\``;
        
        console.log("Using table extraction prompt:", tableExtractionPrompt);
        
        for (const file of selectedFiles) {
          if (file.file && (file.file.type.startsWith('image/') || file.file.type === 'application/pdf')) {
            console.log(`Processing ${file.file.name} for table extraction`);
            
            const base64Image = await fileToBase64(file.file);
            const tableResponse = await extractTablesFromImageWithGemini(base64Image, file.file.type, tableExtractionPrompt);
            
            console.log(`Table extraction response for ${file.file.name}:`, tableResponse);
            
            if (tableResponse.success && tableResponse.data) {
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
                    sourceFile: file.file.name
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

  // Log processing results for debugging
  useEffect(() => {
    if (processingResults) {
      console.log("Processing results updated:", processingResults);
    }
  }, [processingResults]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Document Upload</h2>
        <p className="text-muted-foreground">
          Upload financial documents for processing. Supported formats: PDF, images, Excel, and CSV.
        </p>
      </div>
      
      {/* Post-processing workflow */}
      {(processingComplete || agentsProcessingComplete) && (
        <PostProcessingWorkflow
          tableName={processingOptions.databaseOptions?.tableName}
          processingType={currentAction}
          onClose={agentsProcessingComplete ? resetAgentProcessing : handleWorkflowComplete}
          processingId={processingId || undefined}
          fileId={getProcessedFileId()}
          processingResults={processingResults}
        />
      )}
      
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
                onProcess={(id) => openProcessingDialog([id])}
              />
            </CardContent>
          </Card>
        )
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
