
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, Check, FolderOpen, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink: string;
  parents?: string[];
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
  const [accessToken, setAccessToken] = useState<string>('');
  const { toast } = useToast();

  const CLIENT_ID = '59647658413-2aq8dou9iikfe6dq6ujsp1aiaku5r985.apps.googleusercontent.com';
  const REDIRECT_URI = window.location.origin;
  const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

  const handleGoogleAuth = async () => {
    setIsConnecting(true);
    try {
      // Create OAuth URL
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', SCOPE);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');

      // Open popup for authentication
      const popup = window.open(
        authUrl.toString(),
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for the popup to close or receive auth code
      const checkClosed = setInterval(async () => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
          
          // Check URL parameters for auth code
          const urlParams = new URLSearchParams(window.location.search);
          const authCode = urlParams.get('code');
          
          if (authCode) {
            await exchangeCodeForToken(authCode);
          } else {
            toast({
              title: "Authentication cancelled",
              description: "Google Drive authentication was cancelled",
              variant: "destructive"
            });
          }
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(() => {
        if (popup && !popup.closed) {
          popup.close();
          clearInterval(checkClosed);
          setIsConnecting(false);
          toast({
            title: "Authentication timeout",
            description: "Google Drive authentication timed out",
            variant: "destructive"
          });
        }
      }, 300000);

    } catch (error) {
      setIsConnecting(false);
      toast({
        title: "Connection failed",
        description: "Failed to connect to Google Drive. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exchangeCodeForToken = async (authCode: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: { authCode, scope: SCOPE }
      });

      if (error) throw error;

      if (data.success) {
        setAccessToken(data.accessToken);
        setIsConnected(true);
        await loadGoogleDriveFiles(data.accessToken);
        
        toast({
          title: "Connected to Google Drive",
          description: "Successfully authenticated with your Google Drive account"
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Token exchange failed",
        description: "Failed to complete Google Drive authentication",
        variant: "destructive"
      });
    }
  };

  const loadGoogleDriveFiles = async (token: string, folderId?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-drive', {
        body: {
          accessToken: token,
          action: 'list',
          folderId
        }
      });

      if (error) throw error;

      if (data.success) {
        setFiles(data.data);
      } else {
        throw new Error(data.error);
      }
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
        try {
          const { data, error } = await supabase.functions.invoke('google-drive', {
            body: {
              accessToken,
              action: file.mimeType.includes('google-apps') ? 'export' : 'download',
              fileId: file.id
            }
          });

          if (error) throw error;

          // Convert response to File
          const blob = new Blob([data]);
          const downloadedFile = new File([blob], file.name, { 
            type: file.mimeType.includes('google-apps') ? 'application/pdf' : file.mimeType 
          });
          
          downloadedFiles.push(downloadedFile);
        } catch (fileError) {
          console.error(`Error downloading ${file.name}:`, fileError);
        }
      }
      
      if (downloadedFiles.length > 0) {
        onFilesSelected(downloadedFiles);
        
        toast({
          title: "Files downloaded",
          description: `Successfully downloaded ${downloadedFiles.length} files from Google Drive`
        });
      }
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
            <p className="text-xs text-muted-foreground">
              Client ID: {CLIENT_ID.substring(0, 20)}...
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
            setAccessToken('');
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
          onClick={() => loadGoogleDriveFiles(accessToken)}
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
