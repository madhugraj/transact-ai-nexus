import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Download, X, Brain } from 'lucide-react';
import DocumentPreview from '@/components/ingestion/DocumentPreview';
import { useToast } from '@/hooks/use-toast';
import { GoogleAuthService } from '@/services/auth/googleAuthService';
import { extractPODataFromFile } from '@/services/api/poProcessingService';
import PODataDisplay from './PODataDisplay';

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
  hideDownloadButton?: boolean;
}

const POFilePreview: React.FC<POFilePreviewProps> = ({
  file,
  onDownload,
  isDownloading = false,
  hideDownloadButton = false
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [supabaseData, setSupabaseData] = useState<any>(null);
  const [processingError, setProcessingError] = useState<string>('');
  const { toast } = useToast();

  // Create auth service instance with FIXED redirect URI
  const authService = new GoogleAuthService({
    clientId: '59647658413-2aq8dou9iikfe6dq6ujsp1aiaku5r985.apps.googleusercontent.com',
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    redirectUri: 'https://lovable.app/oauth/callback'  // Fixed redirect URI
  }, 'drive_auth_tokens');

  const handlePreview = () => {
    console.log('🔍 Opening preview for PO file:', file.name);
    
    if (file.mimeType === 'application/pdf' || file.mimeType.startsWith('image/')) {
      const viewerUrl = `https://drive.google.com/file/d/${file.id}/preview`;
      setPreviewUrl(viewerUrl);
      setShowPreview(true);
    } else {
      setPreviewUrl(null);
      setShowPreview(true);
    }
  };

  const handleDownload = () => {
    console.log('📥 Adding PO file to batch:', file.name);
    onDownload(file);
  };

  const handleProcessSingle = async () => {
    console.log('🧠 Processing single file:', file.name);
    setIsProcessing(true);
    setProcessingError('');
    setProcessingResult(null);
    setSupabaseData(null);
    
    try {
      toast({
        title: "Processing File",
        description: `Analyzing ${file.name} for PO data...`,
      });

      // Get access token using the auth service
      const tokens = authService.getStoredTokens();
      if (!tokens.accessToken) {
        throw new Error('No access token found. Please reconnect to Google Drive.');
      }

      console.log('📥 Downloading file for processing:', file.name);
      
      // Download file data using the access token
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: file.mimeType });
      const fileObject = new File([blob], file.name, { type: file.mimeType });

      console.log('📄 File downloaded, processing...', {
        name: fileObject.name,
        size: fileObject.size,
        type: fileObject.type
      });

      // Process with our dedicated PO service
      const result = await extractPODataFromFile(fileObject);

      console.log('🔍 PO processing result:', result);

      if (result.success && result.data) {
        setProcessingResult(result.data);
        setSupabaseData(result.supabaseData);
        toast({
          title: "Processing Complete",
          description: `Successfully extracted PO data from ${file.name}`,
        });
      } else {
        throw new Error(result.error || 'Failed to process file');
      }

    } catch (error) {
      console.error('❌ Single file processing error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process file";
      setProcessingError(errorMessage);
      toast({
        title: "Processing Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
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
        {!hideDownloadButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="h-8 w-8 p-0"
            title="Add to batch processing"
          >
            <Download className={`h-4 w-4 ${isDownloading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
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
          
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Document Preview */}
            <div className="border rounded-lg overflow-hidden">
              {previewUrl ? (
                file.mimeType === 'application/pdf' ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full min-h-[500px]"
                    title={`Preview of ${file.name}`}
                  />
                ) : (
                  <DocumentPreview
                    fileUrl={previewUrl}
                    fileName={file.name}
                    fileType={file.mimeType}
                    height="500px"
                  />
                )
              ) : (
                <div className="flex items-center justify-center h-64 bg-muted/10">
                  <p className="text-muted-foreground">Preview not available for this file type</p>
                </div>
              )}
            </div>

            {/* Processing Results */}
            <div className="border rounded-lg p-4 bg-muted/5 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">AI Processing Results</h3>
                <Button
                  onClick={handleProcessSingle}
                  disabled={isProcessing}
                  size="sm"
                  className="gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Brain className="h-4 w-4 animate-pulse" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      Process Document
                    </>
                  )}
                </Button>
              </div>

              {/* Show processing results OR error OR initial state */}
              {processingResult ? (
                <PODataDisplay 
                  poData={processingResult} 
                  fileName={file.name}
                  supabaseData={supabaseData}
                />
              ) : processingError ? (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <X className="h-4 w-4 text-red-500" />
                    <span className="font-medium text-red-800">Processing Failed</span>
                  </div>
                  <p className="text-sm text-red-700">{processingError}</p>
                  <Button 
                    onClick={handleProcessSingle}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Brain className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm">Click "Process Document" to extract PO data</p>
                  <p className="text-xs mt-1">Results will be formatted for database storage</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button onClick={handleDownload} disabled={isDownloading}>
              <Download className="h-4 w-4 mr-2" />
              Add to Batch
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default POFilePreview;
