
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader, FileText, FolderOpen, Check, Download } from 'lucide-react';

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink: string;
  parents?: string[];
}

interface FileBrowserProps {
  files: GoogleDriveFile[];
  selectedFiles: GoogleDriveFile[];
  isLoading: boolean;
  onFileToggle: (file: GoogleDriveFile) => void;
  onImportFiles: () => void;
}

const FileBrowser = ({ files, selectedFiles, isLoading, onFileToggle, onImportFiles }: FileBrowserProps) => {
  if (files.length === 0 && !isLoading) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Your Files</h3>
        {selectedFiles.length > 0 && (
          <Button
            onClick={onImportFiles}
            disabled={isLoading}
            size="sm"
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Import ({selectedFiles.length})
              </>
            )}
          </Button>
        )}
      </div>

      {isLoading && files.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-1 max-h-64 overflow-y-auto border rounded">
          {files.map((file) => (
            <div
              key={file.id}
              className={`p-2 flex items-center gap-2 hover:bg-muted/50 cursor-pointer transition-colors ${
                selectedFiles.some(f => f.id === file.id) ? 'bg-primary/10' : ''
              }`}
              onClick={() => onFileToggle(file)}
            >
              {file.mimeType === 'application/vnd.google-apps.folder' ? (
                <FolderOpen className="h-4 w-4 text-blue-500" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
              
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{file.name}</div>
                {file.size && (
                  <div className="text-xs text-muted-foreground">{file.size}</div>
                )}
              </div>
              
              {file.mimeType !== 'application/vnd.google-apps.folder' && (
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  selectedFiles.some(f => f.id === file.id) 
                    ? 'bg-primary border-primary' 
                    : 'border-muted-foreground'
                }`}>
                  {selectedFiles.some(f => f.id === file.id) && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileBrowser;
