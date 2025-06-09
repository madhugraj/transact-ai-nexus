
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, FileText, Image, Table } from 'lucide-react';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink?: string;
}

interface FileExplorerProps {
  files: DriveFile[];
  isLoading: boolean;
  onRefresh: () => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, isLoading, onRefresh }) => {
  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return <FileText className="h-4 w-4 text-red-500" />;
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-blue-500" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return <Table className="h-4 w-4 text-green-500" />;
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  const formatFileSize = (size?: string) => {
    if (!size) return 'Unknown size';
    const bytes = parseInt(size);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Files from Google Drive</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading files...
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No files found. Make sure you have documents in your Google Drive.
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(file.mimeType)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{file.name}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>
              </div>
              
              {file.webViewLink && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(file.webViewLink, '_blank')}
                  className="gap-1"
                >
                  <Download className="h-3 w-3" />
                  View
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
