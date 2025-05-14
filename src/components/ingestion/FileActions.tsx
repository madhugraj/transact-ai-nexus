
import { Button } from '@/components/ui/button';
import { Upload, FileText, Table as TableIcon } from 'lucide-react';
import { UploadedFile } from '@/types/fileUpload';

interface FileActionsProps {
  files: UploadedFile[];
  uploadAllFiles: () => void;
  onProcessDocuments: () => void;
  onProcessDataFiles: () => void;
}

const FileActions = ({ 
  files, 
  uploadAllFiles, 
  onProcessDocuments, 
  onProcessDataFiles 
}: FileActionsProps) => {
  const hasIdleFiles = files.some(f => f.status === 'idle');
  const hasUnprocessedFiles = files.some(f => f.status === 'success' && !f.processed);

  return (
    <div className="flex justify-between mb-4">
      <h3 className="font-medium">Selected Files ({files.length})</h3>
      <div className="flex gap-2">
        {hasIdleFiles && (
          <Button size="sm" onClick={uploadAllFiles}>
            <Upload className="mr-2 h-4 w-4" />
            Upload All
          </Button>
        )}
        {hasUnprocessedFiles && (
          <Button size="sm" variant="secondary" onClick={onProcessDataFiles}>
            <TableIcon className="mr-2 h-4 w-4" />
            Process Data Files
          </Button>
        )}
        {hasUnprocessedFiles && (
          <Button size="sm" variant="secondary" onClick={onProcessDocuments}>
            <FileText className="mr-2 h-4 w-4" />
            Process Documents
          </Button>
        )}
      </div>
    </div>
  );
};

export default FileActions;
