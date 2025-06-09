
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ConnectionStatus from './ConnectionStatus';
import FileExplorer from './FileExplorer';

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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Check connection status on mount and periodically
  useEffect(() => {
    checkConnectionStatus();
    
    // Set up periodic token validation every 5 minutes
    const interval = setInterval(checkConnectionStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const tokens = localStorage.getItem('drive_auth_tokens');
      if (!tokens) {
        setIsConnected(false);
        return;
      }

      const parsedTokens = JSON.parse(tokens);
      if (!parsedTokens.accessToken) {
        setIsConnected(false);
        return;
      }

      // Test the connection by making a simple API call
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: {
          action: 'validate_drive_token',
          accessToken: parsedTokens.accessToken
        }
      });

      if (error || !data?.valid) {
        console.log('🔄 Token validation failed, clearing stored tokens');
        localStorage.removeItem('drive_auth_tokens');
        setIsConnected(false);
        setError('Connection expired. Please reconnect.');
      } else {
        setIsConnected(true);
        setError(null);
        // Auto-load files if connected
        if (files.length === 0) {
          loadFiles();
        }
      }
    } catch (error) {
      console.error('❌ Connection check failed:', error);
      setIsConnected(false);
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
      
      // Open auth window
      const authWindow = window.open(
        data.authUrl,
        'google-drive-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!authWindow) {
        throw new Error('Failed to open authentication window. Please check popup blocker settings.');
      }

      // Listen for auth completion
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'GOOGLE_DRIVE_AUTH_SUCCESS') {
          console.log('✅ Google Drive authentication successful');
          
          // Store tokens with error handling
          try {
            localStorage.setItem('drive_auth_tokens', JSON.stringify(event.data.tokens));
            setIsConnected(true);
            setError(null);
            authWindow.close();
            
            toast({
              title: "Connected to Google Drive",
              description: "Successfully connected to your Google Drive account",
            });

            // Auto-load files after successful connection
            setTimeout(() => {
              loadFiles();
            }, 1000);

          } catch (storageError) {
            console.error('❌ Failed to store tokens:', storageError);
            setError('Failed to save authentication tokens');
          }
          
          window.removeEventListener('message', messageListener);
        } else if (event.data.type === 'GOOGLE_DRIVE_AUTH_ERROR') {
          console.error('❌ Google Drive authentication failed:', event.data.error);
          setError(event.data.error || 'Authentication failed');
          authWindow.close();
          window.removeEventListener('message', messageListener);
        }
      };

      window.addEventListener('message', messageListener);

      // Handle window close
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsLoading(false);
        }
      }, 1000);

    } catch (error) {
      console.error('❌ Google Drive connection error:', error);
      setError(error instanceof Error ? error.message : 'Connection failed');
      
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : 'Failed to connect to Google Drive',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('drive_auth_tokens');
    setIsConnected(false);
    setFiles([]);
    setError(null);
    
    toast({
      title: "Disconnected",
      description: "Disconnected from Google Drive",
    });
  };

  const loadFiles = async () => {
    if (!isConnected) {
      console.log('⚠️ Not connected to Google Drive');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tokens = localStorage.getItem('drive_auth_tokens');
      if (!tokens) {
        throw new Error('No authentication tokens found');
      }

      const parsedTokens = JSON.parse(tokens);
      console.log('📁 Loading Google Drive files...');

      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: {
          action: 'list_drive_files',
          accessToken: parsedTokens.accessToken,
          query: "mimeType='application/pdf' or mimeType contains 'image/' or name contains '.csv' or name contains '.xlsx'"
        }
      });

      if (error) {
        // Handle 400 errors specifically
        if (error.message?.includes('400') || error.message?.includes('invalid_grant')) {
          console.log('🔄 Token expired, clearing and requesting reconnection');
          localStorage.removeItem('drive_auth_tokens');
          setIsConnected(false);
          throw new Error('Authentication expired. Please reconnect to Google Drive.');
        }
        throw new Error(`Failed to load files: ${error.message}`);
      }

      if (!data?.files) {
        throw new Error('No files data received');
      }

      console.log(`✅ Loaded ${data.files.length} files from Google Drive`);
      setFiles(data.files);

      toast({
        title: "Files Loaded",
        description: `Found ${data.files.length} files in your Google Drive`,
      });

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Drive Connector</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ConnectionStatus
          isConnected={isConnected}
          isLoading={isLoading}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onLoadFiles={loadFiles}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">{error}</p>
            {error.includes('expired') && (
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2"
                onClick={handleConnect}
              >
                Reconnect
              </Button>
            )}
          </div>
        )}

        {isConnected && (
          <FileExplorer 
            files={files} 
            isLoading={isLoading}
            onRefresh={loadFiles}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleDriveConnectorRefactored;
