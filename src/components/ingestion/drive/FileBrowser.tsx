
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Google Drive Files</span>
          <div className="flex items-center gap-4">
            {selectedFiles.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedFiles.length} file(s) selected
              </span>
            )}
            <Button
              onClick={onImportFiles}
              disabled={isLoading || selectedFiles.length === 0}
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
                  Import {selectedFiles.length > 0 ? `${selectedFiles.length} ` : ''}Files
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-muted-foreground">Loading your files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <div>
              <h3 className="font-medium text-muted-foreground">No files found</h3>
              <p className="text-sm text-muted-foreground">No files were found in your Google Drive</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-2 max-h-80 overflow-y-auto border rounded-md">
            {files.map((file) => (
              <div
                key={file.id}
                className={`p-3 flex items-center gap-3 hover:bg-muted/40 cursor-pointer border-b last:border-b-0 transition-colors ${
                  selectedFiles.some(f => f.id === file.id) ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => onFileToggle(file)}
              >
                {file.mimeType === 'application/vnd.google-apps.folder' ? (
                  <FolderOpen className="h-5 w-5 text-blue-500 flex-shrink-0" />
                ) : (
                  <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {file.size && `${file.size} • `}
                    {new Date(file.modifiedTime).toLocaleDateString()}
                  </div>
                </div>
                
                {file.mimeType !== 'application/vnd.google-apps.folder' && (
                  <div className={`flex h-5 w-5 rounded border-2 items-center justify-center flex-shrink-0 ${
                    selectedFiles.some(f => f.id === file.id) 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {selectedFiles.some(f => f.id === file.id) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileBrowser;
