
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Download, X } from 'lucide-react';
import DocumentPreview from '@/components/ingestion/DocumentPreview';

interface POFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink: string;
}

interface POFilePreviewProps {
  file: POFile;
  onDownload: (file: POFile) => void;
  isDownloading?: boolean;
}

const POFilePreview: React.FC<POFilePreviewProps> = ({
  file,
  onDownload,
  isDownloading = false
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handlePreview = () => {
    console.log('🔍 Opening preview for PO file:', file.name);
    
    // For PDFs and images, we can use the Google Drive webViewLink for preview
    if (file.mimeType === 'application/pdf' || file.mimeType.startsWith('image/')) {
      // Use Google Drive's viewer for preview
      const viewerUrl = `https://drive.google.com/file/d/${file.id}/preview`;
      setPreviewUrl(viewerUrl);
      setShowPreview(true);
    } else {
      // For other file types, show a message that preview is not available
      setPreviewUrl(null);
      setShowPreview(true);
    }
  };

  const handleDownload = () => {
    console.log('📥 Downloading PO file:', file.name);
    onDownload(file);
  };

  const formatFileSize = (size?: string) => {
    if (!size) return 'Unknown size';
    const bytes = parseInt(size);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <span className="text-blue-600 text-xs font-medium">PO</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)} • {new Date(file.modifiedTime).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreview}
            className="h-8 w-8 p-0"
            title="Preview file"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="h-8 w-8 p-0"
            title="Download and process"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span>Preview: {file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 min-h-0">
            {previewUrl ? (
              <div className="h-full border rounded-lg overflow-hidden">
                {file.mimeType === 'application/pdf' ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full min-h-[500px]"
                    title={`Preview of ${file.name}`}
                    onError={() => {
                      console.error('Failed to load PDF preview');
                    }}
                  />
                ) : (
                  <DocumentPreview
                    fileUrl={previewUrl}
                    fileName={file.name}
                    fileType={file.mimeType}
                    height="500px"
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/10">
                <div className="text-center">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Preview not available for this file type</p>
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="mt-4"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isDownloading ? 'Processing...' : 'Download & Process'}
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                handleDownload();
                setShowPreview(false);
              }}
              disabled={isDownloading}
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Processing...' : 'Download & Process'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default POFilePreview;
