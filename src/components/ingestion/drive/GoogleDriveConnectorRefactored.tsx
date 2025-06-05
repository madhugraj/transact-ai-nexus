import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, Check, FolderOpen, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { GoogleAuthService } from '@/services/auth/googleAuthService';
import CompactAuthDialog from '@/components/auth/CompactAuthDialog';

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
  const { toast } = useToast();

  // Configure auth service
  const authService = new GoogleAuthService({
    clientId: '59647658413-2aq8dou9iikfe6dq6ujsp1aiaku5r985.apps.googleusercontent.com',
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    redirectUri: `${window.location.origin}/oauth/callback`
  }, 'drive_auth_tokens');

  // Check for stored tokens on mount
  React.useEffect(() => {
    if (authService.hasValidTokens()) {
      const tokens = authService.getStoredTokens();
      if (tokens.accessToken) {
        setAccessToken(tokens.accessToken);
        setIsConnected(true);
        loadGoogleDriveFiles(tokens.accessToken);
      }
    }
  }, []);

  const handleGoogleAuth = async () => {
    setIsConnecting(true);
    setAuthError('');

    try {
      const result = await authService.authenticateWithPopup();
      
      if (result.success && result.accessToken) {
        setAccessToken(result.accessToken);
        setIsConnected(true);
        setShowAuthDialog(false);
        await loadGoogleDriveFiles(result.accessToken);
        
        toast({
          title: "Connected to Google Drive",
          description: "Successfully authenticated with your Google Drive account"
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
    
    toast({
      title: "Disconnected",
      description: "Google Drive connection has been removed"
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

export default GoogleDriveConnectorRefactored;
