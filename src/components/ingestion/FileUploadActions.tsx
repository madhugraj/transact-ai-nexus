
import { Button } from "@/components/ui/button";
import { Upload, FileCheck, RefreshCw } from "lucide-react";
import { UploadedFile } from "@/types/fileUpload";

interface FileUploadActionsProps {
  files: UploadedFile[];
  uploadAllFiles: () => void;
  onProcessSelected: () => void;
  processingId?: string | null;
  isPolling?: boolean;
}

export default function FileUploadActions({
  files,
  uploadAllFiles,
  onProcessSelected,
  processingId,
  isPolling,
}: FileUploadActionsProps) {
  const hasIdleFiles = files.some(f => f.status === 'idle');
  const hasUploadedFiles = files.some(f => f.status === 'success');

  return (
    <div className="flex flex-wrap gap-2">
      {hasIdleFiles && (
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
        <Button
          variant="outline"
          size="sm"
          onClick={onProcessSelected}
          disabled={isPolling}
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
      )}
    </div>
  );
}
