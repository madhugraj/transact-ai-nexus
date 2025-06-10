
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw, FileText, Image, File } from 'lucide-react';

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
  selectedFiles: string[];
  isLoading: boolean;
  hasLoadedFiles: boolean;
  onFileSelection: (fileId: string, isSelected: boolean) => void;
  onSelectAll: () => void;
  onRefresh: () => void;
}

const FileExplorer = ({ 
  files, 
  selectedFiles,
  isLoading, 
  hasLoadedFiles,
  onFileSelection,
  onSelectAll,
  onRefresh 
}: FileExplorerProps) => {
  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />;
    }
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const formatFileSize = (size?: string) => {
    if (!size) return 'Unknown size';
    const bytes = parseInt(size);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Show loading state
  if (isLoading && !hasLoadedFiles) {
    return (
      <div className="text-center py-8">
        <RefreshCw className="h-8 w-8 mx-auto mb-4 text-blue-500 animate-spin" />
        <p className="text-gray-600">Loading files from Google Drive...</p>
      </div>
    );
  }

  // Show no files found only after we've attempted to load
  if (files.length === 0 && hasLoadedFiles && !isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="mb-2">No PDF or image files found in your Google Drive</p>
        <p className="text-sm text-gray-400 mb-4">We're looking for .pdf files and image files (jpg, png, etc.)</p>
        <Button 
          variant="outline" 
          onClick={onRefresh} 
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedFiles.length === files.length && files.length > 0}
            onCheckedChange={onSelectAll}
            id="select-all"
          />
          <label htmlFor="select-all" className="text-sm font-medium">
            Select All ({selectedFiles.length}/{files.length})
          </label>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="border rounded-lg">
        <div className="max-h-96 overflow-y-auto">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-gray-50"
            >
              <Checkbox
                checked={selectedFiles.includes(file.id)}
                onCheckedChange={(checked) => onFileSelection(file.id, !!checked)}
                id={file.id}
              />
              
              <div className="flex-shrink-0">
                {getFileIcon(file.mimeType)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {file.name}
                </div>
                <div className="text-xs text-gray-500">
                  {formatFileSize(file.size)} • Modified {formatDate(file.modifiedTime)}
                </div>
              </div>
              
              {file.webViewLink && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a 
                    href={file.webViewLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs"
                  >
                    View
                  </a>
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="text-sm text-gray-600">
          {selectedFiles.length} file(s) selected for PO processing
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
