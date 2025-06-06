
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, Check, FolderOpen, FileText, Download, RefreshCw } from 'lucide-react';
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
    setShowPOProcessor(false);
    
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
        setShowPOProcessor(true);
        
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
      {/* Connection Status & Controls */}
      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-green-700 font-medium">Connected to Google Drive</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </div>
      </div>

      {/* File Browser */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Google Drive Files</span>
            <div className="flex items-center gap-4">
              {selectedFiles.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedFiles.length} file(s) selected
                </span>
              )}
              <Button
                onClick={downloadSelectedFiles}
                disabled={isLoading || selectedFiles.length === 0}
                size="sm"
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Import {selectedFiles.length > 0 ? `${selectedFiles.length} ` : ''}Files
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-muted-foreground">Loading your files...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <div>
                <h3 className="font-medium text-muted-foreground">No files found</h3>
                <p className="text-sm text-muted-foreground">No files were found in your Google Drive</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-2 max-h-80 overflow-y-auto border rounded-md">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`p-3 flex items-center gap-3 hover:bg-muted/40 cursor-pointer border-b last:border-b-0 transition-colors ${
                    selectedFiles.some(f => f.id === file.id) ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => toggleFileSelection(file)}
                >
                  {file.mimeType === 'application/vnd.google-apps.folder' ? (
                    <FolderOpen className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  ) : (
                    <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {file.size && `${file.size} • `}
                      {new Date(file.modifiedTime).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {file.mimeType !== 'application/vnd.google-apps.folder' && (
                    <div className={`flex h-5 w-5 rounded border-2 items-center justify-center flex-shrink-0 ${
                      selectedFiles.some(f => f.id === file.id) 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedFiles.some(f => f.id === file.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PO Processing Section */}
      {showPOProcessor && downloadedFiles.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-blue-900">Process Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <POFileProcessor
              selectedFiles={downloadedFiles}
              onProcessingComplete={(results) => {
                console.log('PO processing completed:', results);
                setShowPOProcessor(false);
                setDownloadedFiles([]);
                setSelectedFiles([]);
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoogleDriveConnectorRefactored;
