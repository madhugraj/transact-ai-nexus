
import { useState } from "react";
import { FileList } from "./FileList";
import FileUploadActions from "./FileUploadActions";
import { useFileProcessing } from "@/hooks/useFileProcessing";
import { FileProcessingDialog } from "./dialog/FileProcessingDialog";
import PostProcessingWorkflow from "./PostProcessingWorkflow";
import UploadTabs from "./UploadTabs";

interface FileUploadProps {
  onUploadComplete?: () => void;
}

const FileUpload = ({ onUploadComplete }: FileUploadProps) => {
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [autoSync, setAutoSync] = useState(false);

  const {
    files,
    addFiles,
    removeFile,
    uploadFile,
    uploadAllFiles,
    selectedFileIds,
    selectFilesForProcessing,
    processFiles,
    processingComplete,
    handleWorkflowComplete,
    isDocumentFile,
    isDataFile,
    selectByType,
    processingOptions,
    setProcessingOptions,
    currentAction,
    setCurrentAction,
    processingId,
    isPolling
  } = useFileProcessing();

  // Handle when files are added
  const handleFilesSelected = (newFiles: File[]) => {
    addFiles(newFiles);

    if (autoSync) {
      // Auto upload files if sync is enabled
      setTimeout(() => {
        uploadAllFiles();
      }, 500);
    }
  };
  
  const handleCloudFilesSelected = (newFiles: File[]) => {
    addFiles(newFiles);
    
    // Always auto upload files from cloud sources
    setTimeout(() => {
      uploadAllFiles();
    }, 500);
  };

  // Handle processing a single file
  const handleProcessFile = (fileId: string) => {
    selectFilesForProcessing([fileId]);
    setShowProcessingDialog(true);
  };

  return (
    <div className="space-y-6">
      <UploadTabs
        onFilesSelected={handleFilesSelected}
        onCloudFilesSelected={handleCloudFilesSelected}
        onUploadComplete={onUploadComplete}
      />
      
      <FileList 
        files={files} 
        onRemove={removeFile} 
        onUpload={uploadFile} 
        onProcess={handleProcessFile}
      />
      
      <FileUploadActions
        files={files}
        uploadAllFiles={uploadAllFiles}
        handleProcessFiles={() => setShowProcessingDialog(true)}
        selectFilesForProcessing={selectFilesForProcessing}
        selectByType={selectByType}
        setShowProcessingDialog={setShowProcessingDialog}
        isLoading={false}
        processingId={processingId}
        isPolling={isPolling}
      />
      
      {showProcessingDialog && (
        <FileProcessingDialog
          open={showProcessingDialog}
          onOpenChange={(open) => setShowProcessingDialog(open)}
          selectedFileIds={selectedFileIds}
          files={files}
          currentAction={currentAction}
          setCurrentAction={setCurrentAction}
          processingOptions={processingOptions}
          setProcessingOptions={setProcessingOptions}
          onProcess={() => {
            processFiles();
            setShowProcessingDialog(false);
            setShowWorkflow(true);
          }}
          isDocumentFile={isDocumentFile}
          isDataFile={isDataFile}
        />
      )}
      
      {showWorkflow && processingComplete && (
        <PostProcessingWorkflow
          processingType={currentAction}
          onClose={() => {
            handleWorkflowComplete();
            setShowWorkflow(false);
          }}
        />
      )}
    </div>
  );
};

export default FileUpload;
