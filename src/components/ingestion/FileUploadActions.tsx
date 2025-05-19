
import { Button } from "@/components/ui/button";
import { Upload, FileCheck, RefreshCw, FileType, Database } from "lucide-react";
import { UploadedFile } from "@/types/fileUpload";
import { Dispatch, SetStateAction } from "react";
import { PostProcessAction } from "@/types/processing";

export interface FileUploadActionsProps {
  files: UploadedFile[];
  uploadAllFiles?: () => void;
  onProcessSelected?: () => void;
  processingId?: string | null;
  isPolling?: boolean;
  isLoading?: boolean;
  handleProcessFiles?: () => void;
  selectFilesForProcessing?: (fileIds: string[]) => any;
  selectByType?: (type: "data" | "document") => any;
  setShowProcessingDialog?: Dispatch<SetStateAction<boolean>>;
}

export default function FileUploadActions({
  files,
  uploadAllFiles,
  onProcessSelected,
  processingId,
  isPolling,
  isLoading,
  handleProcessFiles,
  selectFilesForProcessing,
  selectByType,
  setShowProcessingDialog
}: FileUploadActionsProps) {
  const hasIdleFiles = files.some(f => f.status === 'idle');
  const hasUploadedFiles = files.some(f => f.status === 'success');

  // Handle the process button click
  const onProcess = () => {
    if (handleProcessFiles) {
      handleProcessFiles();
    } else if (onProcessSelected) {
      onProcessSelected();
    }
  };

  // Handle the select by type functionality
  const handleSelectByType = (type: "data" | "document") => {
    if (selectByType) {
      selectByType(type);
      if (setShowProcessingDialog) {
        setShowProcessingDialog(true);
      }
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {hasIdleFiles && uploadAllFiles && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={uploadAllFiles} 
          className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
        >
          <Upload className="mr-1 h-4 w-4" />
          Upload All
        </Button>
      )}
      
      {hasUploadedFiles && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onProcess}
            disabled={isPolling || isLoading}
            className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
          >
            {isPolling ? (
              <>
                <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileCheck className="mr-1 h-4 w-4" />
                Process Files
              </>
            )}
          </Button>

          {selectByType && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectByType("document")}
                className="bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200"
              >
                <FileType className="mr-1 h-4 w-4" />
                Process Documents
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectByType("data")}
                className="bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200"
              >
                <Database className="mr-1 h-4 w-4" />
                Process Data Files
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
