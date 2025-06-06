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

  // Create auth service with FIXED redirect URI
  const authService = new GoogleAuthService({
    clientId: '59647658413-2aq8dou9iikfe6dq6ujsp1aiaku5r985.apps.googleusercontent.com',
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    redirectUri: 'https://transact-ai-nexus.lovable.app/oauth/callback'
  }, 'drive_auth_tokens');

  // Check for stored tokens on mount and maintain connection
  React.useEffect(() => {
    const checkStoredAuth = async () => {
      console.log('Checking for stored authentication tokens...');
      if (authService.hasValidTokens()) {
        const tokens = authService.getStoredTokens();
        console.log('Found stored tokens:', { hasAccessToken: !!tokens.accessToken });
        
        if (tokens.accessToken) {
          setAccessToken(tokens.accessToken);
          setIsConnected(true);
          
          // Test the token by trying to load files
          console.log('Testing stored access token...');
          try {
            await loadGoogleDriveFiles(tokens.accessToken);
            setHasLoadedInitialFiles(true);
            console.log('Stored token is valid, files loaded successfully');
          } catch (error) {
            console.error('Stored token is invalid:', error);
            // Clear invalid tokens and reset state
            authService.clearTokens();
            setIsConnected(false);
            setAccessToken('');
            setAuthError('Session expired. Please reconnect.');
          }
        }
      } else {
        console.log('No stored tokens found');
      }
    };
    
    checkStoredAuth();
  }, []);

  const handleGoogleAuth = async () => {
    console.log('Starting Google authentication process...');
    setIsConnecting(true);
    setAuthError('');

    try {
      const result = await authService.authenticateWithPopup();
      console.log('Authentication result:', { success: result.success, hasToken: !!result.accessToken });
      
      if (result.success && result.accessToken) {
        console.log('Authentication successful, testing token...');
        setAccessToken(result.accessToken);
        setIsConnected(true);
        setShowAuthDialog(false);
        setHasLoadedInitialFiles(false);
        
        // Test the new token by loading files
        await loadGoogleDriveFiles(result.accessToken);
        setHasLoadedInitialFiles(true);
        
        toast({
          title: "Connected",
          description: "Successfully connected to Google Drive"
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
      description: "Google Drive connection removed"
    });
  };

  const loadGoogleDriveFiles = async (token: string, folderId?: string) => {
    console.log('Loading Google Drive files with token:', token.substring(0, 20) + '...');
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-drive', {
        body: {
          accessToken: token,
          action: 'list',
          folderId
        }
      });

      console.log('Google Drive API response:', { success: data?.success, error, dataLength: data?.data?.length });

      if (error) {
        console.error('Supabase function error:', error);
        
        // Check if it's an auth error
        if (error.message && (error.message.includes('401') || error.message.includes('invalid_grant') || error.message.includes('UNAUTHENTICATED'))) {
          console.log('Token expired, clearing stored tokens...');
          authService.clearTokens();
          setIsConnected(false);
          setAccessToken('');
          throw new Error('Session expired. Please reconnect to Google Drive.');
        }
        throw error;
      }

      if (data.success) {
        console.log('Successfully loaded files:', data.data.length);
        setFiles(data.data);
      } else {
        console.error('API returned unsuccessful response:', data.error);
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error loading Google Drive files:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load files",
        variant: "destructive"
      });
      
      // If it's an auth error, reset the connection
      if (error instanceof Error && error.message.includes('Session expired')) {
        handleDisconnect();
      }
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
    if (selectedFiles.length === 0) return;

    console.log('Downloading selected files:', selectedFiles.length);
    setIsLoading(true);
    
    try {
      const downloadedFiles: File[] = [];
      
      for (const file of selectedFiles) {
        try {
          console.log('Downloading file:', file.name);
          const { data, error } = await supabase.functions.invoke('google-drive', {
            body: {
              accessToken,
              action: file.mimeType.includes('google-apps') ? 'export' : 'download',
              fileId: file.id
            }
          });

          if (error) {
            console.error('Error downloading file:', file.name, error);
            throw error;
          }

          const blob = new Blob([data]);
          const downloadedFile = new File([blob], file.name, { 
            type: file.mimeType.includes('google-apps') ? 'application/pdf' : file.mimeType 
          });
          
          downloadedFiles.push(downloadedFile);
          console.log('Successfully downloaded:', file.name);
        } catch (fileError) {
          console.error(`Error downloading ${file.name}:`, fileError);
        }
      }
      
      if (downloadedFiles.length > 0) {
        console.log('All files downloaded successfully:', downloadedFiles.length);
        setDownloadedFiles(downloadedFiles);
        onFilesSelected(downloadedFiles);
        
        toast({
          title: "Success",
          description: `${downloadedFiles.length} files imported successfully`
        });
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import failed",
        description: "Failed to import files",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    console.log('Refreshing Google Drive files...');
    if (accessToken) {
      loadGoogleDriveFiles(accessToken);
    }
  };

  const handleProcessingComplete = (results: any[]) => {
    console.log('Processing completed with results:', results.length);
    setDownloadedFiles([]);
    setSelectedFiles([]);
  };

  const handleCloseProcessing = () => {
    console.log('Closing processing section');
    setDownloadedFiles([]);
    setSelectedFiles([]);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium">Connect Google Drive</h3>
          <p className="text-sm text-muted-foreground">Access files from your Google Drive</p>
        </div>
        <Button onClick={() => setShowAuthDialog(true)} className="gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M6.28 3l5.72 10 5.72-10zm11.44 1l-5.72 10 2.86 5h5.72zm-17.44 0l2.86 5h11.44l-2.86-5zm2.86 7l2.86 5 2.86-5z"/>
          </svg>
          Connect Google Drive
        </Button>
        
        <CompactAuthDialog
          isOpen={showAuthDialog}
          onClose={() => setShowAuthDialog(false)}
          title="Google Drive"
          description="Authenticate with your Google account to access your files"
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
    <div className="space-y-4">
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
