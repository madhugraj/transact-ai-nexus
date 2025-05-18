
import { useState } from "react";
import UploadTabs from "./UploadTabs";
import { FileList } from "./FileList";
import FileUploadActions from "./FileUploadActions";
import { useFileProcessing } from "@/hooks/useFileProcessing";
import { FileProcessingDialog } from "./dialog/FileProcessingDialog";
import PostProcessingWorkflow from "./PostProcessingWorkflow";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const FileUpload = () => {
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("upload");
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
    setCurrentAction
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Upload Files</h2>
        <div className="flex items-center gap-2">
          <Label htmlFor="auto-sync" className="text-sm font-medium">
            Auto Sync
          </Label>
          <Switch
            id="auto-sync"
            checked={autoSync}
            onCheckedChange={setAutoSync}
          />
        </div>
      </div>
      
      <UploadTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onFilesSelected={handleFilesSelected}
        onCloudFilesSelected={handleCloudFilesSelected}
        autoSync={autoSync}
        setAutoSync={setAutoSync}
      />
      
      <FileList 
        files={files} 
        onRemove={removeFile} 
        onUpload={uploadFile} 
        onProcess={handleProcessFile}
      />
      
      <FileUploadActions
        files={files}
        isLoading={false}
        handleProcessFiles={() => setShowProcessingDialog(true)}
        selectFilesForProcessing={selectFilesForProcessing}
        selectByType={selectByType}
        setShowProcessingDialog={setShowProcessingDialog}
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
