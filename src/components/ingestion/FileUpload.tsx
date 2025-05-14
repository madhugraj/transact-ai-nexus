
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useFileProcessing } from '@/hooks/useFileProcessing';
import { FileProcessingDialog } from './dialog/FileProcessingDialog';
import { FileList } from './FileList';
import DropZone from './DropZone';
import FileActions from './FileActions';
import PostProcessingWorkflow from './PostProcessingWorkflow';

const FileUpload = () => {
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Document Upload</h1>
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
      
      {files.length > 0 && !processingComplete && (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
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
        onProcess={() => {
          processFiles();
          setShowProcessingDialog(false);
        }}
        isDocumentFile={isDocumentFile}
        isDataFile={isDataFile}
      />
    </div>
  );
};

export default FileUpload;
