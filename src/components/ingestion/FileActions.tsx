
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
    <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-4">
      <div>
        <h3 className="font-medium flex items-center text-sm">
          Files
          <Badge variant="outline" className="ml-2 text-xs">{files.length}</Badge>
        </h3>
        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
          <span>{idleCount} pending</span>
          <span className="mx-1">•</span>
          <span>{successCount} uploaded</span>
          {processedCount > 0 && (
            <>
              <span className="mx-1">•</span>
              <span>{processedCount} processed</span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {hasIdleFiles && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={uploadAllFiles}
            className="h-8 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
          >
            <Upload className="mr-1 h-3 w-3" />
            Upload All
          </Button>
        )}
        {hasUnprocessedFiles && (
          <>
            <Button 
              size="sm" 
              variant="outline"
              onClick={onProcessDataFiles}
              className="h-8 text-xs bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
            >
              <TableIcon className="mr-1 h-3 w-3" />
              Process Data
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={onProcessDocuments}
              className="h-8 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
            >
              <FileText className="mr-1 h-3 w-3" />
              Process Docs
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default FileActions;
