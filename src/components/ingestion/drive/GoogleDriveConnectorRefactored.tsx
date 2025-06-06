
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GoogleAuthService } from '@/services/auth/googleAuthService';
import CompactAuthDialog from '@/components/auth/CompactAuthDialog';
import ConnectionStatus from './ConnectionStatus';
import FileBrowser from './FileBrowser';
import ProcessingSection from './ProcessingSection';

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
  const { toast } = useToast();

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
        setHasLoadedInitialFiles(false);
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
    setDownloadedFiles([]);
    
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
        
        toast({
          title: "Files imported successfully",
          description: `${downloadedFiles.length} files ready for processing`
        });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to import files from Google Drive",
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

  const handleProcessingComplete = (results: any[]) => {
    console.log('PO processing completed:', results);
    setDownloadedFiles([]);
    setSelectedFiles([]);
  };

  const handleCloseProcessing = () => {
    setDownloadedFiles([]);
    setSelectedFiles([]);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Connect to Google Drive</h3>
          <p className="text-muted-foreground">Access your files from Google Drive</p>
        </div>
        <Button onClick={() => setShowAuthDialog(true)} size="lg" className="gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M6.28 3l5.72 10 5.72-10zm11.44 1l-5.72 10 2.86 5h5.72zm-17.44 0l2.86 5h11.44l-2.86-5zm2.86 7l2.86 5 2.86-5z"/>
          </svg>
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConnectionStatus
        isConnected={isConnected}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onDisconnect={handleDisconnect}
      />

      <FileBrowser
        files={files}
        selectedFiles={selectedFiles}
        isLoading={isLoading}
        onFileToggle={toggleFileSelection}
        onImportFiles={downloadSelectedFiles}
      />

      <ProcessingSection
        downloadedFiles={downloadedFiles}
        onProcessingComplete={handleProcessingComplete}
        onClose={handleCloseProcessing}
      />
    </div>
  );
};

export default GoogleDriveConnectorRefactored;
