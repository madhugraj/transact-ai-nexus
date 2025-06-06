import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, Check, FolderOpen, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { GoogleAuthService } from '@/services/auth/googleAuthService';
import CompactAuthDialog from '@/components/auth/CompactAuthDialog';
import POFileProcessor from '../POFileProcessor';

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

const GoogleDriveConnectorRefactored = ({ onFilesSelected }: GoogleDriveConnectorProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [hasLoadedInitialFiles, setHasLoadedInitialFiles] = useState(false);
  const [downloadedFiles, setDownloadedFiles] = useState<File[]>([]);
  const [showPOProcessor, setShowPOProcessor] = useState(false);
  const { toast } = useToast();

  // Use EXACT redirect URI that matches Google Cloud Console configuration
  const authService = new GoogleAuthService({
    clientId: '59647658413-2aq8dou9iikfe6dq6ujsp1aiaku5r985.apps.googleusercontent.com',
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    redirectUri: 'https://79d72649-d878-4ff4-9672-26026a4d9011.lovableproject.com/oauth/callback'
  }, 'drive_auth_tokens');

  // Check for stored tokens on mount and maintain connection
  React.useEffect(() => {
    console.log('Drive connector mounted, checking for stored tokens...');
    
    const checkStoredAuth = () => {
      if (authService.hasValidTokens()) {
        const tokens = authService.getStoredTokens();
        if (tokens.accessToken) {
          console.log('Found stored tokens, setting connected state');
          setAccessToken(tokens.accessToken);
          setIsConnected(true);
          
          // Only load files if we haven't loaded them yet
          if (!hasLoadedInitialFiles) {
            loadGoogleDriveFiles(tokens.accessToken);
            setHasLoadedInitialFiles(true);
          }
        }
      }
    };

    checkStoredAuth();
  }, [hasLoadedInitialFiles]);

  const handleGoogleAuth = async () => {
    console.log('Starting Google Drive authentication...');
    setIsConnecting(true);
    setAuthError('');

    try {
      const result = await authService.authenticateWithPopup();
      console.log('Authentication result:', result);
      
      if (result.success && result.accessToken) {
        setAccessToken(result.accessToken);
        setIsConnected(true);
        setShowAuthDialog(false);
        setHasLoadedInitialFiles(false); // Reset to allow loading
        await loadGoogleDriveFiles(result.accessToken);
        setHasLoadedInitialFiles(true);
        
        toast({
          title: "Connected to Google Drive",
          description: "Successfully authenticated with your Google Drive account"
        });
      } else {
        console.error('Authentication failed:', result.error);
        setAuthError(result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    console.log('Disconnecting from Google Drive...');
    authService.clearTokens();
    setIsConnected(false);
    setFiles([]);
    setSelectedFiles([]);
    setAccessToken('');
    setShowAuthDialog(false);
    setHasLoadedInitialFiles(false);
    
    toast({
      title: "Disconnected",
      description: "Google Drive connection has been removed"
    });
  };

  const loadGoogleDriveFiles = async (token: string, folderId?: string) => {
    console.log('Loading Google Drive files...');
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-drive', {
        body: {
          accessToken: token,
          action: 'list',
          folderId
        }
      });

      if (error) {
        console.error('Google Drive API error:', error);
        // If token is invalid, clear stored tokens and require re-auth
        if (error.message && error.message.includes('invalid_grant')) {
          authService.clearTokens();
          setIsConnected(false);
          setAccessToken('');
          throw new Error('Session expired. Please reconnect to Google Drive.');
        }
        throw error;
      }

      console.log('Google Drive files loaded:', data);
      if (data.success) {
        setFiles(data.data);
        console.log(`Successfully loaded ${data.data.length} files`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error loading files",
        description: error instanceof Error ? error.message : "Failed to load files from Google Drive",
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
        setDownloadedFiles(downloadedFiles);
        onFilesSelected(downloadedFiles);
        
        // Show PO processor option
        setShowPOProcessor(true);
        
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

  const handleRefresh = () => {
    console.log('Refresh button clicked for Google Drive');
    if (accessToken) {
      loadGoogleDriveFiles(accessToken);
      toast({
        title: "Refreshing files",
        description: "Reloading files from Google Drive..."
      });
    } else {
      toast({
        title: "Not connected",
        description: "Please connect to Google Drive first",
        variant: "destructive"
      });
    }
  };

  if (!isConnected) {
    return (
      <>
        <Button onClick={() => setShowAuthDialog(true)} className="w-full">
          Connect to Google Drive
        </Button>
        
        <CompactAuthDialog
          isOpen={showAuthDialog}
          onClose={() => setShowAuthDialog(false)}
          title="Google Drive"
          description="Authenticate with your Google account to access your Drive files"
          isConnecting={isConnecting}
          isConnected={isConnected}
          onConnect={handleGoogleAuth}
          onDisconnect={handleDisconnect}
          error={authError}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-green-600">✓ Connected to Google Drive</span>
        <Button variant="outline" size="sm" onClick={handleDisconnect}>
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
          onClick={handleRefresh}
          disabled={isLoading}
          size="sm"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
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

      {showPOProcessor && downloadedFiles.length > 0 && (
        <Card className="p-4">
          <POFileProcessor
            selectedFiles={downloadedFiles}
            onProcessingComplete={(results) => {
              console.log('PO processing completed:', results);
              setShowPOProcessor(false);
              setDownloadedFiles([]);
            }}
          />
        </Card>
      )}
    </div>
  );
};

export default GoogleDriveConnectorRefactored;
