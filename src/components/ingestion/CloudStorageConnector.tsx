
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Check, File, FileText, FolderOpen, List, Loader } from 'lucide-react';
import { connectToCloudStorage, downloadCloudFile, listCloudStorageFiles } from '@/services/api/cloudStorageService';
import { CloudStorageProvider, CloudFile } from '@/types/cloudStorage';
import { useToast } from '@/hooks/use-toast';

interface CloudStorageConnectorProps {
  onFilesSelected: (files: File[]) => void;
}

const CloudStorageConnector = ({ onFilesSelected }: CloudStorageConnectorProps) => {
  const [provider, setProvider] = useState<CloudStorageProvider>('google_drive');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<CloudFile[]>([]);
  const [autoSync, setAutoSync] = useState(false);
  const [authDetails, setAuthDetails] = useState({
    clientId: '',
    clientSecret: '',
    email: '',
    password: ''
  });
  const { toast } = useToast();
  
  // Connect to the selected cloud storage provider
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await connectToCloudStorage(provider, {
        clientId: authDetails.clientId,
        clientSecret: authDetails.clientSecret,
        email: authDetails.email,
        password: authDetails.password
      });
      
      if (response.success) {
        setIsConnected(true);
        toast({
          title: "Connected successfully",
          description: `Connected to ${getProviderName(provider)}`
        });
        
        // Load files from root
        loadFiles();
      } else {
        toast({
          title: "Connection failed",
          description: response.error || "Could not connect to cloud storage",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection error",
        description: error instanceof Error ? error.message : "An error occurred during connection",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Load files from the current or specified folder
  const loadFiles = async (folderId: string | null = currentFolder) => {
    setIsLoading(true);
    try {
      const response = await listCloudStorageFiles(provider, folderId, searchQuery);
      if (response.success && response.data) {
        setFiles(response.data);
        setCurrentFolder(folderId);
      } else {
        toast({
          title: "Error loading files",
          description: response.error || "Could not load files from storage",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error loading files",
        description: error instanceof Error ? error.message : "An error occurred while loading files",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Download selected files and pass them to parent component
  const handleDownload = async () => {
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
        if (file.isFolder) continue;
        
        const response = await downloadCloudFile(file);
        if (response.success && response.data) {
          downloadedFiles.push(response.data);
        } else {
          toast({
            title: "Error downloading file",
            description: response.error || `Could not download ${file.name}`,
            variant: "destructive"
          });
        }
      }
      
      if (downloadedFiles.length > 0) {
        onFilesSelected(downloadedFiles);
        
        toast({
          title: "Files downloaded",
          description: `Downloaded ${downloadedFiles.length} files`
        });
      }
    } catch (error) {
      toast({
        title: "Download error",
        description: error instanceof Error ? error.message : "An error occurred during download",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle file selection
  const toggleFileSelection = (file: CloudFile) => {
    if (selectedFiles.some(f => f.id === file.id)) {
      setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
    } else {
      setSelectedFiles(prev => [...prev, file]);
    }
  };

  // Navigate to a folder
  const navigateToFolder = (folder: CloudFile) => {
    if (folder.isFolder) {
      setCurrentFolder(folder.id);
      loadFiles(folder.id);
    }
  };

  // Navigate to parent folder
  const navigateToParent = () => {
    // Find the parent of the current folder
    const currentFolderObj = files.find(f => f.id === currentFolder);
    const parentId = currentFolderObj?.parentId || null;
    
    setCurrentFolder(parentId);
    loadFiles(parentId);
  };

  // Get display name for provider
  const getProviderName = (provider: CloudStorageProvider) => {
    switch (provider) {
      case 'google_drive':
        return 'Google Drive';
      case 'onedrive':
        return 'OneDrive';
      case 'sharepoint':
        return 'SharePoint';
      case 'dropbox':
        return 'Dropbox';
      default:
        return provider;
    }
  };

  return (
    <div className="space-y-4">
      {!isConnected ? (
        <div className="space-y-4">
          <Tabs defaultValue="google_drive" onValueChange={(value) => setProvider(value as CloudStorageProvider)}>
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="google_drive">Google Drive</TabsTrigger>
              <TabsTrigger value="onedrive">OneDrive</TabsTrigger>
              <TabsTrigger value="sharepoint">SharePoint</TabsTrigger>
              <TabsTrigger value="dropbox">Dropbox</TabsTrigger>
            </TabsList>
            
            <TabsContent value="google_drive" className="space-y-3 pt-3">
              <div>
                <Label htmlFor="client-id">Client ID</Label>
                <Input 
                  id="client-id" 
                  placeholder="Google API Client ID" 
                  value={authDetails.clientId}
                  onChange={(e) => setAuthDetails({...authDetails, clientId: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="client-secret">Client Secret</Label>
                <Input 
                  id="client-secret" 
                  type="password"
                  placeholder="Google API Client Secret" 
                  value={authDetails.clientSecret}
                  onChange={(e) => setAuthDetails({...authDetails, clientSecret: e.target.value})}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="onedrive" className="space-y-3 pt-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  placeholder="Microsoft Account Email" 
                  value={authDetails.email}
                  onChange={(e) => setAuthDetails({...authDetails, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  placeholder="Microsoft Account Password" 
                  value={authDetails.password}
                  onChange={(e) => setAuthDetails({...authDetails, password: e.target.value})}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="sharepoint" className="space-y-3 pt-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  placeholder="SharePoint Email" 
                  value={authDetails.email}
                  onChange={(e) => setAuthDetails({...authDetails, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  placeholder="SharePoint Password" 
                  value={authDetails.password}
                  onChange={(e) => setAuthDetails({...authDetails, password: e.target.value})}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="dropbox" className="space-y-3 pt-3">
              <div>
                <Label htmlFor="client-id">Client ID</Label>
                <Input 
                  id="client-id" 
                  placeholder="Dropbox API Key" 
                  value={authDetails.clientId}
                  onChange={(e) => setAuthDetails({...authDetails, clientId: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="client-secret">Client Secret</Label>
                <Input 
                  id="client-secret" 
                  type="password"
                  placeholder="Dropbox API Secret" 
                  value={authDetails.clientSecret}
                  onChange={(e) => setAuthDetails({...authDetails, clientSecret: e.target.value})}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-sync-cloud"
              checked={autoSync}
              onCheckedChange={setAutoSync}
            />
            <Label htmlFor="auto-sync-cloud">Enable Auto Sync</Label>
          </div>
          
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <Loader className="h-4 w-4 animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              `Connect to ${getProviderName(provider)}`
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm">Connected to {getProviderName(provider)}</span>
              </div>
              
              {currentFolder && (
                <Button variant="ghost" size="sm" onClick={navigateToParent}>
                  <FolderOpen className="h-4 w-4 mr-1" />
                  Up
                </Button>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Input 
                placeholder="Search files..." 
                className="h-8 w-40"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadFiles()}
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => loadFiles()}
                disabled={isLoading}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* File list */}
          <Card className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : files.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No files found
              </div>
            ) : (
              <div className="divide-y">
                {files.map((file) => (
                  <div 
                    key={file.id}
                    className="p-2 flex items-center hover:bg-muted/40 cursor-pointer"
                    onClick={() => file.isFolder ? navigateToFolder(file) : toggleFileSelection(file)}
                  >
                    {file.isFolder ? (
                      <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2 text-gray-500" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{file.name}</div>
                      {!file.isFolder && (
                        <div className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </div>
                      )}
                    </div>
                    
                    {!file.isFolder && (
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
              onClick={() => {
                setIsConnected(false);
                setFiles([]);
                setSelectedFiles([]);
              }}
              size="sm"
            >
              Disconnect
            </Button>
            
            <Button 
              onClick={handleDownload}
              disabled={isLoading || selectedFiles.length === 0}
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 mr-1 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  Import {selectedFiles.length} file(s)
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudStorageConnector;
