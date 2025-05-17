
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Image, File, Loader } from 'lucide-react';

interface DocumentPreviewProps {
  fileUrl: string | null;
  fileName?: string;
  fileType?: string;
  height?: string;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  fileUrl,
  fileName,
  fileType,
  height = '400px'
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Reset states when file URL changes
    if (fileUrl) {
      setLoading(true);
      setError(null);
    } else {
      setLoading(false);
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

  // No file provided
  if (!fileUrl) {
    return (
      <Card className="flex items-center justify-center bg-muted/20" style={{ height }}>
        <div className="text-center p-6">
          <File className="mx-auto h-10 w-10 text-muted-foreground/60 mb-2" />
          <p className="text-sm text-muted-foreground">No document to preview</p>
        </div>
      </Card>
    );
  }

  // Loading state
  if (loading && !isImage) {
    return (
      <Card className="w-full flex flex-col items-center justify-center bg-muted/20" style={{ height }}>
        <Loader className="h-8 w-8 text-muted-foreground/60 animate-spin mb-2" />
        <p className="text-sm text-muted-foreground">Loading document preview...</p>
      </Card>
    );
  }

  // Image preview
  if (isImage) {
    return (
      <Card className="overflow-hidden">
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
              <Loader className="h-8 w-8 text-muted-foreground/60 animate-spin" />
            </div>
          )}
          <AspectRatio ratio={16 / 9} className="bg-muted">
            <img
              src={fileUrl}
              alt={fileName || 'Document preview'}
              className="object-contain w-full h-full"
              onLoad={handleImageLoaded}
              onError={handleImageError}
              style={{ display: loading ? 'none' : 'block' }}
            />
          </AspectRatio>
        </div>
        {fileName && (
          <div className="p-2 text-center text-sm text-muted-foreground border-t">
            <Image className="inline-block w-4 h-4 mr-1" />
            <span>{fileName}</span>
          </div>
        )}
      </Card>
    );
  }

  // PDF preview
  if (isPdf) {
    return (
      <Card className="overflow-hidden">
        <iframe
          src={fileUrl}
          title={fileName || 'PDF Document'}
          className="w-full"
          style={{ height }}
          onLoad={() => setLoading(false)}
        />
        {fileName && (
          <div className="p-2 text-center text-sm text-muted-foreground border-t">
            <FileText className="inline-block w-4 h-4 mr-1" />
            <span>{fileName}</span>
          </div>
        )}
      </Card>
    );
  }

  // Generic file preview (non-image, non-PDF)
  return (
    <Card className="flex flex-col items-center justify-center bg-muted/20" style={{ height }}>
      <div className="text-center p-6">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground/60 mb-2" />
        <p className="text-sm font-medium mb-1">{fileName || 'Unknown document'}</p>
        <p className="text-xs text-muted-foreground">
          {fileType || 'This document type cannot be previewed'}
        </p>
      </div>
    </Card>
  );
};

export default DocumentPreview;
