
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CloudStorageProvider, connectToCloudStorage, listCloudStorageFiles } from '@/services/api/cloudStorageService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileCheck, CloudOff, Folder } from 'lucide-react';

interface CloudStorageConnectorProps {
  onFilesSelected: (files: File[]) => void;
}

const CloudStorageConnector: React.FC<CloudStorageConnectorProps> = ({ onFilesSelected }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<CloudStorageProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  
  const handleConnect = async (storageProvider: CloudStorageProvider) => {
    setIsConnecting(true);
    setProvider(storageProvider);
    
    try {
      const response = await connectToCloudStorage(storageProvider);
      
      if (response.success) {
        setIsConnected(true);
        toast({
          title: "Connected successfully",
          description: `Connected to ${getProviderName(storageProvider)}`
        });
        
        // Load files after connecting
        loadFiles(storageProvider, response.data.token);
      } else {
        toast({
          title: "Connection failed",
          description: response.error || "Failed to connect to cloud storage",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  const loadFiles = async (storageProvider: CloudStorageProvider, token?: string) => {
    setIsLoading(true);
    
    try {
      const response = await listCloudStorageFiles({
        provider: storageProvider,
        token
      });
      
      if (response.success) {
        toast({
          title: "Files loaded",
          description: `Found ${response.data.files.length} files`
        });
      } else {
        toast({
          title: "Failed to load files",
          description: response.error || "Could not retrieve files from storage",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error loading files",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getProviderName = (storageProvider: CloudStorageProvider): string => {
    switch (storageProvider) {
      case 'google-drive': return 'Google Drive';
      case 'onedrive': return 'OneDrive';
      case 'sharepoint': return 'SharePoint';
      default: return 'Local Storage';
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Connect Cloud Storage</CardTitle>
        <CardDescription>Import documents directly from your cloud storage</CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-2 rounded bg-green-50">
              <FileCheck className="h-5 w-5 text-green-600" />
              <span className="text-green-600">
                Connected to {provider && getProviderName(provider)}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsConnected(false)} 
                className="flex items-center gap-2"
                size="sm"
              >
                <CloudOff className="h-4 w-4" />
                Disconnect
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => provider && loadFiles(provider)} 
                className="flex items-center gap-2"
                size="sm"
              >
                <Folder className="h-4 w-4" />
                {isLoading ? 
                  <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Loading...</> : 
                  'Browse Files'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              disabled={isConnecting}
              onClick={() => handleConnect('google-drive')}
            >
              {isConnecting && provider === 'google-drive' ? 
                <Loader2 className="h-5 w-5 animate-spin mb-1" /> :
                <svg viewBox="0 0 87.3 78" className="h-8 w-8 mb-1"><path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3 1.4.8 2.9 1.2 4.5 1.2h51.8c1.6 0 3.1-.4 4.5-1.2 1.35-.8 2.5-1.9 3.3-3.3l3.85-6.65-75.1 0z" fill="#0066da"/><path d="m45.95 12.8-18.1 31.5-9.95 17.25-11.3 19.3h75.1l-11.4-19.3z" fill="#00ac47"/><path d="m45.95 12.8 24.1 41.7 11.3 19.3 3.85-6.65c.8-1.4 1.2-2.9 1.2-4.5v-43.1c0-1.6-.4-3.1-1.2-4.5-.8-1.35-1.95-2.5-3.3-3.3-1.4-.8-2.9-1.2-4.5-1.2h-27.2c-3.3 0-5.9 1.7-7.25 3.25z" fill="#ea4335"/><path d="m45.95 12.8-24.1 41.7-11.4 19.4 3.95 6.65c.8 1.4 1.95 2.5 3.3 3.3 1.4.8 2.9 1.2 4.5 1.2h51.8c1.6 0 3.1-.4 4.5-1.2 1.35-.8 2.5-1.9 3.3-3.3l3.85-6.65-11.3-19.3z" fill="#ffba00"/></svg>
              }
              Google Drive
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              disabled={isConnecting}
              onClick={() => handleConnect('onedrive')}
            >
              {isConnecting && provider === 'onedrive' ? 
                <Loader2 className="h-5 w-5 animate-spin mb-1" /> :
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" className="mb-1">
                  <path fill="#0078d4" d="M1.75 14.45q-.2 0-.3.025q-.1.025-.175.1q-.075.075-.1.15q-.025.075-.05.175a5.05 5.05 0 0 0 .75 2.475q.65 1.075 1.725 1.7q1.075.625 2.35.625h8q1.425 0 2.65-.55q1.225-.55 2.125-1.5q.9-.95 1.425-2.225q.525-1.275.525-2.675a6.05 6.05 0 0 0-.75-2.95a6.417 6.417 0 0 0-2.05-2.25q-1.3-.85-2.95-.85q-1.05 0-1.975.325q-.925.325-1.7.975A3.792 3.792 0 0 0 9.5 5.85A3.895 3.895 0 0 0 5.6 9.95q-.35 0-.825.125q-.475.125-.925.35q-.45.225-.8.55q-.35.325-.575.75q-.225.425-.35.925q-.125.5-.125 1.025q0 .375.05.7q.05.325.175.575q.125.25.4.45q.275.2.675.2h2.45z"/>
                </svg>
              }
              OneDrive
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              disabled={isConnecting}
              onClick={() => handleConnect('sharepoint')}
            >
              {isConnecting && provider === 'sharepoint' ? 
                <Loader2 className="h-5 w-5 animate-spin mb-1" /> :
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" className="mb-1">
                  <path d="M8 10.108 8.392 10.892 8.8 10.108 9.408 10.536 9.008 11.312 9.966 11.745 9.331 12.175 9.958 12.473 9.317 12.905 10 14z" fill="#036c70"/>
                  <path d="M11.467 19.029 11 18.5 10.507 16.887 11.706 16.344 12.332 17.815 11.467 19.029z" fill="#036c70"/>
                  <path d="M21.735 17.83 22 16.5 23.117 16.069 22.85 17.337 21.735 17.83z" fill="#036c70"/>
                  <path d="M6.585 19.885 7.273 19.11 7.965 20.067 7.283 20.835 6.585 19.885z" fill="#036c70"/>
                  <path d="M16 2 3 7.054 3 24.946 16 30 29 24.946 29 7.054 16 2zM5.123 22.006 3.703 22.902 3.703 9.424 14.191 4.282 14.191 6.555 6.695 10.219 5.123 22.006zm11.915-15.937v2.759l-1.604.585a2.264 2.264 0 0 0-2.187-.033L9.498 8.358 9.498 8.359 9.461 8.372A1.358 1.358 0 0 0 8.179 9.712a1.358 1.358 0 0 0 1.885 1.26l2.063 1.022a2.257 2.257 0 0 0-.421 1.307c0 .567.21 1.084.556 1.479l-.298 1.578a.873.873 0 1 0 1.327 1.031l.693-.523a2.235 2.235 0 0 0 .529.065c.253 0 .495-.042.721-.119l2.116 1.253a1.37 1.37 0 1 0 2.294-.956l-1.053-1.958a2.26 2.26 0 0 0 1.066-1.916c0-.632-.259-1.203-.677-1.616l.364-1.962a1.067 1.067 0 1 0 .748-1.857l-2.051-1.055a2.261 2.261 0 0 0-1.307-1.644l.003-.122V6.555 4.282 4.28l10.487 5.144v13.478l-18.229-8.941-.475 10.88 8.225 4.037v-2.366l3.238 1.637 5.666-2.778-8.903-4.417z" fill="#036c70"/>
                </svg>
              }
              SharePoint
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CloudStorageConnector;
