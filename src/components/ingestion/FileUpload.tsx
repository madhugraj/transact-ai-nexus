
import { useState } from "react";
import UploadTabs from "./UploadTabs";
import FileList from "./FileList";
import FileUploadActions from "./FileUploadActions";
import { useFileProcessing } from "@/hooks/useFileProcessing";
import FileProcessingDialog from "./dialog/FileProcessingDialog";
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
    handleWorkflowComplete
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
      
      <FileList files={files} onRemove={removeFile} onUpload={uploadFile} />
      
      <FileUploadActions
        files={files}
        onUploadAll={uploadAllFiles}
        onProcess={() => setShowProcessingDialog(true)}
      />
      
      {showProcessingDialog && (
        <FileProcessingDialog
          open={showProcessingDialog}
          onClose={() => setShowProcessingDialog(false)}
          onStart={(action, options) => {
            processFiles();
            setShowProcessingDialog(false);
            setShowWorkflow(true);
            return true;
          }}
        />
      )}
      
      {showWorkflow && processingComplete && (
        <PostProcessingWorkflow
          open={showWorkflow}
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
