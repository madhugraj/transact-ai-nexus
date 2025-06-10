import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ConnectionStatus from './ConnectionStatus';
import FileExplorer from './FileExplorer';
import { POProcessor } from './processing/POProcessor';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink?: string;
}

const GoogleDriveConnectorRefactored = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [processingResults, setProcessingResults] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedFiles, setHasLoadedFiles] = useState(false);
  const { toast } = useToast();

  // Check connection status on mount and restore session
  useEffect(() => {
    console.log('Google Drive connector mounted, checking for stored tokens...');
    initializeConnection();
  }, []);

  const initializeConnection = async () => {
    try {
      console.log('🔄 Initializing Google Drive connection...');
      const tokens = localStorage.getItem('drive_auth_tokens');
      
      if (!tokens) {
        console.log('❌ No stored tokens found');
        setIsConnected(false);
        setError(null);
        return;
      }

      const parsedTokens = JSON.parse(tokens);
      console.log('Retrieved stored tokens:', { 
        hasAccessToken: !!parsedTokens.accessToken,
        timestamp: parsedTokens.timestamp,
        age: parsedTokens.timestamp ? Date.now() - parsedTokens.timestamp : 'unknown'
      });

      if (!parsedTokens.accessToken) {
        console.log('❌ No access token in stored tokens');
        setIsConnected(false);
        setError(null);
        return;
      }

      // Check if tokens are not too old (24 hours)
      if (parsedTokens.timestamp) {
        const tokenAge = Date.now() - parsedTokens.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (tokenAge > maxAge) {
          console.log('❌ Tokens are too old, clearing them');
          localStorage.removeItem('drive_auth_tokens');
          setIsConnected(false);
          setError('Session expired. Please reconnect to Google Drive.');
          return;
        }
      }

      console.log('✅ Found valid stored tokens, setting connected state');
      setIsConnected(true);
      setError(null);

      // Auto-load files after successful connection
      await loadFiles(parsedTokens.accessToken);
    } catch (error) {
      console.error('❌ Connection initialization failed:', error);
      setIsConnected(false);
      setError('Failed to initialize connection. Please try connecting again.');
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔗 Initiating Google Drive connection...');
      
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: {
          action: 'get_drive_auth_url',
          scopes: ['https://www.googleapis.com/auth/drive.readonly']
        }
      });

      if (error) {
        throw new Error(`Auth URL generation failed: ${error.message}`);
      }

      if (!data?.authUrl) {
        throw new Error('No auth URL received from server');
      }

      console.log('🔗 Opening Google Drive auth URL');
      
      // Try to open popup with better error handling
      let authWindow;
      try {
        authWindow = window.open(
          data.authUrl, 
          'google-drive-auth', 
          'width=600,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,directories=no,status=no'
        );
      } catch (popupError) {
        console.error('❌ Failed to open popup:', popupError);
        throw new Error('Failed to open authentication window. Please check if popups are blocked and try again.');
      }

      if (!authWindow) {
        throw new Error('Failed to open authentication window. Please allow popups for this site and try again.');
      }

      let messageReceived = false;
      let checkClosedInterval: NodeJS.Timeout;

      // Listen for messages from the popup
      const messageListener = (event: MessageEvent) => {
        console.log('📨 Message received:', {
          origin: event.origin,
          data: event.data
        });
        
        if (event.data && typeof event.data === 'object') {
          if (event.data.type === 'OAUTH_SUCCESS' && event.data.code) {
            messageReceived = true;
            console.log('✅ OAuth success detected');
            exchangeCodeForTokens(event.data.code);
            authWindow.close();
            window.removeEventListener('message', messageListener);
            if (checkClosedInterval) {
              clearInterval(checkClosedInterval);
            }
          } else if (event.data.type === 'OAUTH_ERROR') {
            messageReceived = true;
            console.error('❌ OAuth error:', event.data.error);
            setError(event.data.error || 'Authentication failed');
            authWindow.close();
            window.removeEventListener('message', messageListener);
            if (checkClosedInterval) {
              clearInterval(checkClosedInterval);
            }
            setIsLoading(false);
          }
        }
      };

      window.addEventListener('message', messageListener);
      console.log('👂 Message listener added, waiting for popup response...');

      // Check if popup is closed
      checkClosedInterval = setInterval(() => {
        if (authWindow.closed) {
          console.log('⚠️ Popup was closed');
          clearInterval(checkClosedInterval);
          window.removeEventListener('message', messageListener);
          
          if (!messageReceived) {
            console.log('❌ No message received before popup closed');
            setError('Authentication was cancelled. Please complete the authentication process.');
            setIsLoading(false);
          }
        }
      }, 250);

      // Cleanup after timeout
      setTimeout(() => {
        if (!messageReceived) {
          console.log('⏰ Authentication timeout');
          window.removeEventListener('message', messageListener);
          if (checkClosedInterval) {
            clearInterval(checkClosedInterval);
          }
          if (authWindow && !authWindow.closed) {
            authWindow.close();
          }
          setError('Authentication timeout. Please try again.');
          setIsLoading(false);
        }
      }, 5 * 60 * 1000); // 5 minutes

    } catch (error) {
      console.error('❌ Google Drive connection error:', error);
      setError(error instanceof Error ? error.message : 'Connection failed');
      setIsLoading(false);
    }
  };

  const exchangeCodeForTokens = async (authCode: string) => {
    try {
      console.log('🔄 Exchanging authorization code for tokens...');
      const redirectUri = `${window.location.origin}/oauth/callback`;
      
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: {
          authCode: authCode,
          redirectUri: redirectUri
        }
      });

      if (error) {
        throw new Error(`Token exchange failed: ${error.message}`);
      }

      if (!data?.accessToken) {
        throw new Error('No access token received');
      }

      const tokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
        scope: data.scope,
        timestamp: Date.now()
      };

      localStorage.setItem('drive_auth_tokens', JSON.stringify(tokens));
      console.log('✅ Tokens stored successfully');
      
      setIsConnected(true);
      setError(null);
      setIsLoading(false);
      
      toast({
        title: "Connected to Google Drive",
        description: "Successfully connected to your Google Drive account"
      });

      // Load files immediately after connection
      await loadFiles(data.accessToken);
    } catch (error) {
      console.error('❌ Token exchange failed:', error);
      setError(error instanceof Error ? error.message : 'Token exchange failed');
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('drive_auth_tokens');
    setIsConnected(false);
    setFiles([]);
    setSelectedFiles([]);
    setProcessingResults([]);
    setError(null);
    setHasLoadedFiles(false);
    console.log('🔌 Disconnected from Google Drive');
    toast({
      title: "Disconnected",
      description: "Disconnected from Google Drive"
    });
  };

  const loadFiles = async (accessToken?: string) => {
    if (!isConnected && !accessToken) {
      console.log('❌ Not connected, cannot load files');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let tokenToUse = accessToken;
      if (!tokenToUse) {
        const tokens = localStorage.getItem('drive_auth_tokens');
        if (!tokens) {
          throw new Error('No authentication tokens found');
        }
        const parsedTokens = JSON.parse(tokens);
        tokenToUse = parsedTokens.accessToken;
      }

      console.log('📁 Loading files from Google Drive...');
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: {
          action: 'list_drive_files',
          accessToken: tokenToUse,
          query: "mimeType='application/pdf' or mimeType contains 'image/'"
        }
      });

      if (error) {
        if (error.message?.includes('400') || error.message?.includes('invalid_grant')) {
          localStorage.removeItem('drive_auth_tokens');
          setIsConnected(false);
          throw new Error('Authentication expired. Please reconnect to Google Drive.');
        }
        throw new Error(`Failed to load files: ${error.message}`);
      }

      console.log(`✅ Loaded ${data.files?.length || 0} files from Google Drive`);
      setFiles(data.files || []);
      setHasLoadedFiles(true);

      if (data.files?.length > 0) {
        toast({
          title: "Files Loaded",
          description: `Found ${data.files.length} files in your Google Drive`
        });
      }
    } catch (error) {
      console.error('❌ Failed to load Drive files:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load files';
      setError(errorMessage);
      toast({
        title: "Failed to Load Files",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelection = (fileId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedFiles(prev => [...prev, fileId]);
    } else {
      setSelectedFiles(prev => prev.filter(id => id !== fileId));
    }
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map(file => file.id));
    }
  };

  const downloadSelectedFiles = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select files to download",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const fileObjects: File[] = [];

    try {
      const tokens = localStorage.getItem('drive_auth_tokens');
      if (!tokens) throw new Error('No authentication tokens');
      const parsedTokens = JSON.parse(tokens);

      for (const fileId of selectedFiles) {
        const file = files.find(f => f.id === fileId);
        if (!file) continue;

        // Download file content
        const { data, error } = await supabase.functions.invoke('google-auth', {
          body: {
            action: 'download_file',
            accessToken: parsedTokens.accessToken,
            fileId: fileId
          }
        });

        if (error) {
          console.error(`Failed to download ${file.name}:`, error);
          continue;
        }

        // Convert base64 to File object
        const binaryString = atob(data.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const fileObject = new File([bytes], file.name, {
          type: file.mimeType || 'application/octet-stream'
        });
        fileObjects.push(fileObject);
      }

      if (fileObjects.length === 0) {
        throw new Error('No files could be downloaded');
      }

      console.log(`✅ Downloaded ${fileObjects.length} files successfully`);

      // Process the downloaded files for PO extraction
      await processPOFiles(fileObjects);
    } catch (error) {
      console.error('❌ Download failed:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : 'Failed to download files',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processPOFiles = async (fileObjects: File[]) => {
    setIsProcessing(true);
    try {
      console.log(`🚀 Starting PO processing for ${fileObjects.length} files`);
      const processor = new POProcessor();
      const results = await processor.processFiles(fileObjects);
      setProcessingResults(results);

      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;

      toast({
        title: "PO Processing Complete",
        description: `Successfully processed ${successCount} POs, ${errorCount} errors`
      });

      console.log(`✅ PO processing complete. Success: ${successCount}, Errors: ${errorCount}`);
    } catch (error) {
      console.error('❌ PO processing failed:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : 'Failed to process PO files',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefresh = () => {
    loadFiles();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Drive Document Processor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ConnectionStatus 
          isConnected={isConnected} 
          isLoading={isLoading} 
          error={error} 
          onConnect={handleConnect} 
          onDisconnect={handleDisconnect} 
          onLoadFiles={handleRefresh} 
        />

        {isConnected && (
          <>
            <FileExplorer 
              files={files}
              selectedFiles={selectedFiles}
              isLoading={isLoading}
              onFileSelection={handleFileSelection}
              onSelectAll={handleSelectAll}
              onRefresh={handleRefresh}
              hasLoadedFiles={hasLoadedFiles}
            />

            {selectedFiles.length > 0 && (
              <div className="flex gap-2">
                <Button 
                  onClick={downloadSelectedFiles} 
                  disabled={isLoading || isProcessing} 
                  className="flex-1"
                >
                  {isProcessing ? 'Processing POs...' : `Process ${selectedFiles.length} Selected Files`}
                </Button>
              </div>
            )}

            {processingResults.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Processing Results:</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {processingResults.map((result, index) => (
                    <div 
                      key={index} 
                      className={`p-2 rounded text-sm ${
                        result.status === 'success' 
                          ? 'bg-green-50 text-green-800' 
                          : result.status === 'error' 
                          ? 'bg-red-50 text-red-800' 
                          : 'bg-yellow-50 text-yellow-800'
                      }`}
                    >
                      <div className="font-medium">{result.fileName}</div>
                      {result.status === 'success' && result.isPO && (
                        <div className="mt-1">
                          <div>PO Number: {result.extractedData?.po_number || 'N/A'}</div>
                          <div>Vendor: {result.extractedData?.vendor_code || 'N/A'}</div>
                          <div>Stored in Database ✓</div>
                        </div>
                      )}
                      {result.status === 'skipped' && (
                        <div className="text-xs">{result.reason}</div>
                      )}
                      {result.error && (
                        <div className="text-xs text-red-600">{result.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleDriveConnectorRefactored;
