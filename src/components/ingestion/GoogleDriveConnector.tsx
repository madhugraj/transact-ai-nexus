
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader, Check, FolderOpen, FileText } from 'lucide-react';

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink: string;
}

interface GoogleDriveConnectorProps {
  onFilesSelected: (files: File[]) => void;
}

const GoogleDriveConnector = ({ onFilesSelected }: GoogleDriveConnectorProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleAuth = async () => {
    setIsConnecting(true);
    try {
      // This would normally use Google OAuth2 flow
      // For now, we'll simulate the authentication
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsConnected(true);
      await loadGoogleDriveFiles();
      
      toast({
        title: "Connected to Google Drive",
        description: "Successfully authenticated with your Google Drive account"
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Failed to connect to Google Drive. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const loadGoogleDriveFiles = async () => {
    setIsLoading(true);
    try {
      // Simulate Google Drive API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockFiles: GoogleDriveFile[] = [
        {
          id: '1',
          name: 'Financial Report Q3.pdf',
          mimeType: 'application/pdf',
          size: '2.5 MB',
          modifiedTime: '2024-01-15T10:30:00Z',
          webViewLink: 'https://drive.google.com/file/d/1/view'
        },
        {
          id: '2',
          name: 'Invoices Folder',
          mimeType: 'application/vnd.google-apps.folder',
          modifiedTime: '2024-01-20T15:45:00Z',
          webViewLink: 'https://drive.google.com/drive/folders/2'
        },
        {
          id: '3',
          name: 'Contract Agreement.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: '1.2 MB',
          modifiedTime: '2024-01-18T09:15:00Z',
          webViewLink: 'https://drive.google.com/file/d/3/view'
        }
      ];
      
      setFiles(mockFiles);
    } catch (error) {
      toast({
        title: "Error loading files",
        description: "Failed to load files from Google Drive",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFileSelection = (file: GoogleDriveFile) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') return;
    
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id);
      if (isSelected) {
        return prev.filter(f => f.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  };

  const downloadSelectedFiles = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to download"
      });
      return;
    }

    setIsLoading(true);
    try {
      const downloadedFiles: File[] = [];
      
      for (const file of selectedFiles) {
        // Simulate file download from Google Drive
        const response = await new Promise<File>((resolve) => {
          setTimeout(() => {
            const content = `Mock content for ${file.name}`;
            const mockFile = new File([content], file.name, { type: file.mimeType });
            resolve(mockFile);
          }, 1000);
        });
        
        downloadedFiles.push(response);
      }
      
      onFilesSelected(downloadedFiles);
      
      toast({
        title: "Files downloaded",
        description: `Successfully downloaded ${downloadedFiles.length} files from Google Drive`
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download files from Google Drive",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Connect to Google Drive</h3>
            <p className="text-sm text-muted-foreground">
              Authenticate with your Google account to access your Drive files
            </p>
          </div>
          
          <Button
            onClick={handleGoogleAuth}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Connecting to Google Drive...
              </>
            ) : (
              'Connect Google Drive'
            )}
          </Button>
          
          <div className="text-xs text-muted-foreground">
            <p>You'll be redirected to Google to authorize access</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-sm">Connected to Google Drive</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsConnected(false);
            setFiles([]);
            setSelectedFiles([]);
          }}
        >
          Disconnect
        </Button>
      </div>

      <Card className="max-h-60 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <Loader className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No files found in your Google Drive
          </div>
        ) : (
          <div className="divide-y">
            {files.map((file) => (
              <div
                key={file.id}
                className="p-3 flex items-center hover:bg-muted/40 cursor-pointer"
                onClick={() => toggleFileSelection(file)}
              >
                {file.mimeType === 'application/vnd.google-apps.folder' ? (
                  <FolderOpen className="h-4 w-4 mr-3 text-blue-500" />
                ) : (
                  <FileText className="h-4 w-4 mr-3 text-gray-500" />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {file.size && `${file.size} • `}
                    {new Date(file.modifiedTime).toLocaleDateString()}
                  </div>
                </div>
                
                {file.mimeType !== 'application/vnd.google-apps.folder' && (
                  <div className="flex h-4 w-4 rounded border border-primary ml-2">
                    {selectedFiles.some(f => f.id === file.id) && (
                      <Check className="h-3 w-3 text-primary" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={loadGoogleDriveFiles}
          disabled={isLoading}
          size="sm"
        >
          Refresh
        </Button>
        
        <Button
          onClick={downloadSelectedFiles}
          disabled={isLoading || selectedFiles.length === 0}
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader className="h-4 w-4 mr-1 animate-spin" />
              Downloading...
            </>
          ) : (
            `Import ${selectedFiles.length} file(s)`
          )}
        </Button>
      </div>
    </div>
  );
};

export default GoogleDriveConnector;
