
import { Button } from '@/components/ui/button';
import { Upload, FileText, Table as TableIcon } from 'lucide-react';
import { UploadedFile } from '@/types/fileUpload';
import { Badge } from '@/components/ui/badge';

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

  const idleCount = files.filter(f => f.status === 'idle').length;
  const successCount = files.filter(f => f.status === 'success').length;
  const processedCount = files.filter(f => f.processed).length;

  return (
    <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-4">
      <div>
        <h3 className="font-medium flex items-center">
          Files
          <Badge variant="outline" className="ml-2">{files.length}</Badge>
        </h3>
        <div className="flex gap-2 mt-1 text-sm text-muted-foreground">
          <span>{idleCount} waiting</span> • 
          <span>{successCount} uploaded</span> • 
          <span>{processedCount} processed</span>
        </div>
      </div>
      
      <div className="flex gap-2">
        {hasIdleFiles && (
          <Button size="sm" onClick={uploadAllFiles} className="transition-all duration-200 hover:scale-105">
            <Upload className="mr-2 h-4 w-4" />
            Upload All
          </Button>
        )}
        {hasUnprocessedFiles && (
          <Button size="sm" variant="secondary" onClick={onProcessDataFiles} className="transition-all duration-200 hover:scale-105">
            <TableIcon className="mr-2 h-4 w-4" />
            Process Data Files
          </Button>
        )}
        {hasUnprocessedFiles && (
          <Button size="sm" variant="secondary" onClick={onProcessDocuments} className="transition-all duration-200 hover:scale-105">
            <FileText className="mr-2 h-4 w-4" />
            Process Documents
          </Button>
        )}
      </div>
    </div>
  );
};

export default FileActions;
