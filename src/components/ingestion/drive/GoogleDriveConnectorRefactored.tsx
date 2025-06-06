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
    const checkStoredAuth = () => {
      if (authService.hasValidTokens()) {
        const tokens = authService.getStoredTokens();
        if (tokens.accessToken) {
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
    setIsConnecting(true);
    setAuthError('');

    try {
      const result = await authService.authenticateWithPopup();
      
      if (result.success && result.accessToken) {
        setAccessToken(result.accessToken);
        setIsConnected(true);
        setShowAuthDialog(false);
        setHasLoadedInitialFiles(false);
        await loadGoogleDriveFiles(result.accessToken);
        setHasLoadedInitialFiles(true);
        
        toast({
          title: "Connected",
          description: "Successfully connected to Google Drive"
        });
      } else {
        setAuthError(result.error || 'Authentication failed');
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
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
        if (error.message && error.message.includes('invalid_grant')) {
          authService.clearTokens();
          setIsConnected(false);
          setAccessToken('');
          throw new Error('Session expired. Please reconnect.');
        }
        throw error;
      }

      if (data.success) {
        setFiles(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load files",
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
    if (selectedFiles.length === 0) return;

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
          title: "Success",
          description: `${downloadedFiles.length} files imported`
        });
      }
    } catch (error) {
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
    if (accessToken) {
      loadGoogleDriveFiles(accessToken);
    }
  };

  const handleProcessingComplete = (results: any[]) => {
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
          description="Authenticate with your Google account"
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
