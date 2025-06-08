
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Download, X, Brain } from 'lucide-react';
import DocumentPreview from '@/components/ingestion/DocumentPreview';
import { extractTablesFromImage } from '@/services/api/geminiService';
import { useToast } from '@/hooks/use-toast';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const { toast } = useToast();

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
    console.log('📥 Downloading PO file:', file.name);
    onDownload(file);
  };

  const handleProcessSingle = async () => {
    console.log('🧠 Processing single file with Gemini:', file.name);
    setIsProcessing(true);
    
    try {
      toast({
        title: "Processing File",
        description: `Analyzing ${file.name} with Gemini AI...`,
      });

      // First download the file from Google Drive
      const accessToken = localStorage.getItem('google_drive_access_token');
      if (!accessToken) {
        throw new Error('No access token found. Please reconnect to Google Drive.');
      }

      console.log('📥 Downloading file for processing:', file.name);
      
      // Download file data
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: file.mimeType });
      const fileObject = new File([blob], file.name, { type: file.mimeType });

      console.log('📄 File downloaded, processing with Gemini...', {
        name: fileObject.name,
        size: fileObject.size,
        type: fileObject.type
      });

      // Process with Gemini
      const result = await extractTablesFromImage(fileObject, `
        Extract Purchase Order (PO) data from this document. Return structured JSON with:
        {
          "po_number": "PO number",
          "vendor": "Vendor name", 
          "date": "PO date",
          "total_amount": "Total amount",
          "items": [
            {
              "description": "Item description",
              "quantity": "Quantity", 
              "unit_price": "Unit price",
              "total": "Line total"
            }
          ],
          "shipping_address": "Shipping address",
          "billing_address": "Billing address"
        }
      `);

      console.log('🔍 Gemini processing result:', result);

      if (result.success) {
        setProcessingResult(result.data);
        toast({
          title: "Processing Complete",
          description: `Successfully extracted PO data from ${file.name}`,
        });
      } else {
        throw new Error(result.error || 'Failed to process file');
      }

    } catch (error) {
      console.error('❌ Single file processing error:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process file",
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
            title="Add to batch processing"
          >
            <Download className={`h-4 w-4 ${isDownloading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
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
            <div className="border rounded-lg p-4 bg-muted/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">AI Processing</h3>
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
                      Process with Gemini
                    </>
                  )}
                </Button>
              </div>

              {processingResult ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <h4 className="font-medium text-green-800 mb-2">Extracted PO Data:</h4>
                    <pre className="text-xs text-green-700 whitespace-pre-wrap overflow-auto max-h-96">
                      {JSON.stringify(processingResult, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Brain className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                  <p>Click "Process with Gemini" to extract PO data</p>
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
