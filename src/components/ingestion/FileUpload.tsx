
import { useState } from "react";
import { FileList } from "./FileList";
import FileUploadActions from "./FileUploadActions";
import { useFileProcessing } from "@/hooks/useFileProcessing";
import { FileProcessingDialog } from "./FileProcessingDialog";
import PostProcessingWorkflow from "./PostProcessingWorkflow";
import DropZone from "./DropZone";

interface FileUploadProps {
  onUploadComplete?: () => void;
  onFilesSelected?: (files: File[]) => void;
}

const FileUpload = ({ onUploadComplete, onFilesSelected }: FileUploadProps) => {
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
    console.log("🔄 FileUpload: files selected", newFiles.length);
    console.log("📁 FileUpload: file details:", newFiles.map(f => ({ 
      name: f.name, 
      size: f.size, 
      type: f.type 
    })));
    
    if (newFiles && newFiles.length > 0) {
      addFiles(newFiles);
      console.log("✅ FileUpload: files added to state");
      
      if (onFilesSelected) {
        console.log("📤 FileUpload: notifying parent component about selected files");
        onFilesSelected(newFiles);
      }
  
      if (autoSync) {
        console.log("🔄 FileUpload: auto uploading files");
        setTimeout(() => {
          uploadAllFiles();
        }, 500);
      }
    }
  };
  
  const handleCloudFilesSelected = (newFiles: File[]) => {
    console.log("☁️ FileUpload: cloud files selected", newFiles.length);
    
    if (newFiles && newFiles.length > 0) {
      addFiles(newFiles);
      
      if (onFilesSelected) {
        onFilesSelected(newFiles);
      }
      
      // Always auto upload files from cloud sources
      setTimeout(() => {
        uploadAllFiles();
      }, 500);
    }
  };

  // Handle processing a single file
  const handleProcessFile = (fileId: string) => {
    console.log("🔧 FileUpload: processing single file:", fileId);
    selectFilesForProcessing([fileId]);
    setShowProcessingDialog(true);
  };

  return (
    <div className="space-y-6">
      <DropZone onFilesSelected={handleFilesSelected} />
      
      <FileList 
        files={files} 
        onRemove={removeFile} 
        onUpload={uploadFile} 
        onProcess={handleProcessFile}
      />
      
      <FileUploadActions
        files={files}
        uploadAllFiles={uploadAllFiles}
        handleProcessFiles={() => {
          console.log("🔧 FileUpload: starting bulk file processing");
          setShowProcessingDialog(true);
        }}
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
            console.log("🚀 FileUpload: starting file processing workflow");
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
