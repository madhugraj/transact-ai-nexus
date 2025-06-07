
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileText, Folder, Download } from 'lucide-react';
import POFilePreview from './POFilePreview';

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

const FileBrowser: React.FC<FileBrowserProps> = ({
  files,
  selectedFiles,
  isLoading,
  onFileToggle,
  onImportFiles
}) => {
  const formatFileSize = (size?: string) => {
    if (!size) return 'Unknown size';
    const bytes = parseInt(size);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="h-4 w-4 text-blue-500" />;
    }
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  const isPOFile = (fileName: string) => {
    const name = fileName.toLowerCase();
    return name.includes('po') || 
           name.includes('purchase') || 
           name.includes('order') ||
           name.includes('procurement');
  };

  const handleDownloadPOFile = async (file: GoogleDriveFile) => {
    console.log('📥 Downloading PO file from FileBrowser:', file.name);
    console.log('📥 File details being processed:', {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      webViewLink: file.webViewLink
    });
    
    // Select the file first
    onFileToggle(file);
    
    // Wait a moment for state update, then trigger import
    setTimeout(() => {
      console.log('📥 Triggering import for PO file:', file.name);
      onImportFiles();
    }, 100);
  };

  const regularFiles = files.filter(file => !isPOFile(file.name));
  const poFiles = files.filter(file => isPOFile(file.name));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Google Drive Files</span>
          {selectedFiles.length > 0 && (
            <Button 
              onClick={onImportFiles} 
              disabled={isLoading}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Import {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No files found in your Google Drive</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* PO Files Section */}
            {poFiles.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-medium">Purchase Order Files</h3>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {poFiles.length} found
                  </Badge>
                </div>
                <div className="space-y-2">
                  {poFiles.map((file) => (
                    <POFilePreview
                      key={file.id}
                      file={file}
                      onDownload={handleDownloadPOFile}
                      isDownloading={isLoading}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Files Section */}
            {regularFiles.length > 0 && (
              <div>
                {poFiles.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-medium">Other Files</h3>
                    <Badge variant="outline">
                      {regularFiles.length} files
                    </Badge>
                  </div>
                )}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {regularFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {file.mimeType !== 'application/vnd.google-apps.folder' && (
                        <Checkbox
                          checked={selectedFiles.some(f => f.id === file.id)}
                          onCheckedChange={() => onFileToggle(file)}
                        />
                      )}
                      
                      <div className="flex-shrink-0">
                        {getFileIcon(file.mimeType)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)} • {new Date(file.modifiedTime).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {file.mimeType === 'application/vnd.google-apps.folder' && (
                        <Badge variant="outline" className="text-xs">
                          Folder
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileBrowser;
