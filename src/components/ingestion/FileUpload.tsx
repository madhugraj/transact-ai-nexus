
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useFileProcessing } from '@/hooks/useFileProcessing';
import { FileProcessingDialog } from './dialog/FileProcessingDialog';
import { FileList } from './FileList';
import DropZone from './DropZone';
import FileActions from './FileActions';
import PostProcessingWorkflow from './PostProcessingWorkflow';
import { Skeleton } from '@/components/ui/skeleton';

const FileUpload = () => {
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
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
    handleWorkflowComplete
  } = useFileProcessing();

  // Open processing dialog for selected files
  const openProcessingDialog = (fileIds: string[]) => {
    selectFilesForProcessing(fileIds);
    setShowProcessingDialog(true);
  };

  // Handle file processing with loading state
  const handleProcessFiles = () => {
    setIsLoading(true);
    processFiles();
    setShowProcessingDialog(false);
    setTimeout(() => setIsLoading(false), 1000);
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
      {processingComplete && (
        <PostProcessingWorkflow
          tableName={processingOptions.databaseOptions?.tableName}
          processingType={currentAction}
          onClose={handleWorkflowComplete}
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
        files.length > 0 && !processingComplete && (
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
