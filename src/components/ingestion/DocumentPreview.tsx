
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Image, File, Loader } from 'lucide-react';

interface DocumentPreviewProps {
  fileUrl: string | null;
  fileName?: string;
  fileType?: string;
  height?: string;
  maxHeight?: string;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  fileUrl,
  fileName,
  fileType,
  height = '400px',
  maxHeight
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Reset states when file URL changes
    if (fileUrl) {
      setLoading(true);
      setError(null);
    }
  }, [fileUrl]);

  // Handle image load complete
  const handleImageLoaded = () => {
    setLoading(false);
  };

  // Handle image load error
  const handleImageError = () => {
    setLoading(false);
    setError('Failed to load image');
  };

  // Determine if the file is an image
  const isImage = fileType?.startsWith('image/');
  
  // Determine if the file is a PDF
  const isPdf = fileType === 'application/pdf';

  // Use height or maxHeight prop correctly
  const styleProps = maxHeight ? { maxHeight } : { height };

  // No file provided
  if (!fileUrl) {
    return (
      <Card className="flex items-center justify-center bg-muted/20" style={styleProps}>
        <div className="text-center p-6">
          <File className="mx-auto h-10 w-10 text-muted-foreground/60 mb-2" />
          <p className="text-sm text-muted-foreground">No document to preview</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-muted/40 shadow-sm">
      <div className="relative" style={styleProps}>
        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-10">
            <div className="text-center p-6">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          </div>
        )}
        
        {/* Image preview */}
        {isImage && (
          <div className="h-full flex items-center justify-center bg-muted/10">
            <img 
              src={fileUrl} 
              alt={fileName || 'Document preview'} 
              className="max-h-full max-w-full object-contain"
              onLoad={handleImageLoaded}
              onError={handleImageError}
            />
          </div>
        )}
        
        {/* PDF preview */}
        {isPdf && (
          <iframe 
            src={`${fileUrl}#toolbar=0`}
            title={fileName || 'PDF Document'}
            className="w-full h-full"
            onLoad={() => setLoading(false)}
          />
        )}
        
        {/* Fallback for other file types */}
        {!isImage && !isPdf && (
          <div className="h-full flex items-center justify-center bg-muted/10">
            <div className="text-center p-6">
              <FileText className="mx-auto h-12 w-12 text-primary/60 mb-2" />
              <p className="text-sm font-medium">{fileName || 'Document'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Preview not available for this file type
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* File name caption */}
      {fileName && (
        <div className="p-2 text-xs text-center text-muted-foreground border-t truncate">
          {fileName}
        </div>
      )}
    </Card>
  );
};

export default DocumentPreview;
