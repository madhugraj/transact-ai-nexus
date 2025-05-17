
import React, { useState, useEffect } from 'react';
import { FileText, FileImage, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface DocumentPreviewProps {
  fileUrl: string | null;
  fileName?: string;
  fileType?: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
  maxHeight?: string;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  fileUrl,
  fileName = 'Document',
  fileType,
  onLoad,
  onError,
  maxHeight = '600px'
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when file URL changes
    setLoading(true);
    setError(null);
  }, [fileUrl]);

  const handleLoad = () => {
    setLoading(false);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setLoading(false);
    const errorMsg = `Failed to load ${fileName || 'document'}`;
    setError(errorMsg);
    if (onError) onError(errorMsg);
  };

  const renderFileIcon = () => {
    const size = 48;
    
    if (fileType?.startsWith('image/')) {
      return <FileImage size={size} className="text-blue-500" />;
    } else if (fileType === 'application/pdf') {
      return <FileText size={size} className="text-red-500" />;
    } else if (
      fileType === 'application/vnd.ms-excel' || 
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileType === 'text/csv'
    ) {
      return <FileSpreadsheet size={size} className="text-green-500" />;
    } else {
      return <FileText size={size} className="text-gray-500" />;
    }
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p>Loading document preview...</p>
        </div>
      );
    }

    if (error || !fileUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <AlertCircle className="h-10 w-10 mb-4 text-orange-500" />
          <p>{error || 'No document available for preview'}</p>
        </div>
      );
    }

    if (fileType?.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center overflow-hidden" style={{ maxHeight }}>
          <img 
            src={fileUrl} 
            alt={fileName || 'Document preview'} 
            className="max-w-full max-h-full object-contain rounded"
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      );
    } else if (fileType === 'application/pdf') {
      return (
        <div className="w-full" style={{ height: maxHeight }}>
          <iframe 
            src={`${fileUrl}#toolbar=0`}
            title={fileName || 'PDF Document'}
            className="w-full h-full rounded border"
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      );
    } else {
      // For other file types, display a preview card with file info
      return (
        <div className="flex flex-col items-center justify-center py-10 border rounded">
          {renderFileIcon()}
          <div className="mt-4 text-center">
            <h3 className="font-medium">{fileName || 'Document'}</h3>
            <p className="text-sm text-muted-foreground">{fileType || 'Unknown file type'}</p>
          </div>
        </div>
      );
    }
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        {renderPreview()}
      </CardContent>
    </Card>
  );
};

export default DocumentPreview;
