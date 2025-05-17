
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { CloudFile, CloudStorageProvider, CloudStorageAuthResult } from '@/types/cloudStorage';
import * as api from '@/services/api';
import { Loader, Search, FolderOpen, ArrowLeft, FileText, Download, UploadCloud, Check, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CloudProviderConfig {
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const cloudProviders: Record<CloudStorageProvider, CloudProviderConfig> = {
  'google-drive': {
    name: 'Google Drive',
    icon: <UploadCloud className="text-blue-500" />,
    color: 'blue',
    description: 'Connect to your Google Drive account'
  },
  'onedrive': {
    name: 'Microsoft OneDrive',
    icon: <UploadCloud className="text-blue-600" />,
    color: 'blue',
    description: 'Connect to your OneDrive account'
  },
  'sharepoint': {
    name: 'SharePoint',
    icon: <UploadCloud className="text-green-600" />,
    color: 'green',
    description: 'Connect to your SharePoint site'
  },
  'dropbox': {
    name: 'Dropbox',
    icon: <UploadCloud className="text-blue-400" />,
    color: 'blue',
    description: 'Connect to your Dropbox account'
  },
  'box': {
    name: 'Box',
    icon: <UploadCloud className="text-blue-700" />,
    color: 'blue',
    description: 'Connect to your Box account'
  }
};

interface CloudStorageConnectorProps {
  onFilesSelected: (files: File[]) => void;
}

const CloudStorageConnector: React.FC<CloudStorageConnectorProps> = ({ onFilesSelected }) => {
  const [activeProvider, setActiveProvider] = useState<CloudStorageProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [authResult, setAuthResult] = useState<CloudStorageAuthResult | null>(null);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<Array<{id: string | null, name: string}>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<CloudFile[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [authDetails, setAuthDetails] = useState<{
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  }>({
    clientId: '',
    clientSecret: '',
    redirectUri: window.location.origin + '/auth/callback'
  });
  const [syncOptions, setSyncOptions] = useState({
    autoSync: false,
    syncInterval: 'daily',
    syncTime: '00:00'
  });
  const [showAuthForm, setShowAuthForm] = useState(false);

  // Connect to a cloud storage provider
  const connectToProvider = async (provider: CloudStorageProvider) => {
    setActiveProvider(provider);
    setShowAuthForm(true);
  };

  // Authorize with provider
  const authorizeWithProvider = async () => {
    setIsConnecting(true);
    
    try {
      const response = await api.connectToCloudStorage(activeProvider!, {
        clientId: authDetails.clientId,
        clientSecret: authDetails.clientSecret,
        redirectUri: authDetails.redirectUri,
      });
      
      if (response.success && response.data) {
        setAuthResult(response.data);
        setShowAuthForm(false);
        
        toast({
          title: "Connected successfully",
          description: `Connected to ${activeProvider} successfully.`,
        });
        
        // Load files from root
        loadFiles(activeProvider!, null);
      } else {
        toast({
          title: "Connection failed",
          description: response.error || `Failed to connect to ${activeProvider}.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection error",
        description: error instanceof Error ? error.message : "An error occurred during connection",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Load files from a specific folder
  const loadFiles = async (provider: CloudStorageProvider, folderId: string | null, query: string = '') => {
    setIsLoading(true);
    
    try {
      const response = await api.listCloudStorageFiles(provider, folderId, query);
      
      if (response.success && response.data) {
        setFiles(response.data);
      } else {
        toast({
          title: "Failed to load files",
          description: response.error || "Could not load files from cloud storage",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error loading files",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to a folder
  const navigateToFolder = (folder: CloudFile) => {
    // Save current folder to history
    setFolderHistory(prev => [...prev, { 
      id: currentFolder,
      name: currentFolder === null ? 'Root' : folder.name
    }]);
    
    // Set new current folder
    setCurrentFolder(folder.id);
    
    // Load files from the new folder
    loadFiles(folder.provider, folder.id);
    
    // Clear selected files
    setSelectedFiles([]);
  };

  // Navigate back to previous folder
  const navigateBack = () => {
    if (folderHistory.length > 0) {
      const lastFolder = folderHistory[folderHistory.length - 1];
      setCurrentFolder(lastFolder.id);
      
      // Remove last folder from history
      setFolderHistory(prev => prev.slice(0, -1));
      
      // Load files from the previous folder
      loadFiles(activeProvider!, lastFolder.id);
      
      // Clear selected files
      setSelectedFiles([]);
    }
  };

  // Toggle file selection
  const toggleFileSelection = (file: CloudFile) => {
    if (file.isFolder) return; // Cannot select folders
    
    const isSelected = selectedFiles.some(f => f.id === file.id);
    
    if (isSelected) {
      setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
    } else {
      setSelectedFiles(prev => [...prev, file]);
    }
  };

  // Download selected files and pass to parent
  const downloadSelectedFiles = async () => {
    if (selectedFiles.length === 0) return;
    
    setDownloading(true);
    
    try {
      const downloadedFiles: File[] = [];
      
      for (const file of selectedFiles) {
        const response = await api.downloadCloudFile(file);
        if (response.success && response.data) {
          downloadedFiles.push(response.data);
        }
      }
      
      if (downloadedFiles.length > 0) {
        onFilesSelected(downloadedFiles);
        
        toast({
          title: "Files imported",
          description: `Successfully imported ${downloadedFiles.length} files.`,
        });
        
        // Close the provider view
        setActiveProvider(null);
        setAuthResult(null);
        setSelectedFiles([]);
      }
    } catch (error) {
      toast({
        title: "Download error",
        description: error instanceof Error ? error.message : "Failed to download selected files",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    if (!activeProvider) return;
    loadFiles(activeProvider, currentFolder, searchQuery);
  };

  // Clear provider and auth state
  const disconnect = () => {
    setActiveProvider(null);
    setAuthResult(null);
    setFiles([]);
    setCurrentFolder(null);
    setFolderHistory([]);
    setSelectedFiles([]);
    setShowAuthForm(false);
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // If authorization form is shown
  if (activeProvider && showAuthForm) {
    const provider = cloudProviders[activeProvider];
    
    return (
      <Card className="w-full shadow-sm">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            {provider.icon}
            <CardTitle>{provider.name} Connection</CardTitle>
          </div>
          <CardDescription>
            Enter your authentication details to connect
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-id">Client ID</Label>
            <Input
              id="client-id"
              placeholder="Enter Client ID"
              value={authDetails.clientId}
              onChange={(e) => setAuthDetails(prev => ({ ...prev, clientId: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="client-secret">Client Secret</Label>
            <Input
              id="client-secret"
              type="password"
              placeholder="Enter Client Secret"
              value={authDetails.clientSecret}
              onChange={(e) => setAuthDetails(prev => ({ ...prev, clientSecret: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="redirect-uri">Redirect URI</Label>
            <Input
              id="redirect-uri"
              placeholder="Redirect URI"
              value={authDetails.redirectUri}
              onChange={(e) => setAuthDetails(prev => ({ ...prev, redirectUri: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              This should match the redirect URI registered in your OAuth application
            </p>
          </div>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-sync">Auto Sync</Label>
                <Switch
                  id="auto-sync"
                  checked={syncOptions.autoSync}
                  onCheckedChange={(checked) => setSyncOptions(prev => ({ ...prev, autoSync: checked }))}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically sync files from this cloud storage
              </p>
            </div>
            
            {syncOptions.autoSync && (
              <div className="space-y-4 pl-6 border-l-2 border-muted">
                <div className="space-y-2">
                  <Label htmlFor="sync-interval">Sync Interval</Label>
                  <Select 
                    value={syncOptions.syncInterval}
                    onValueChange={(value) => setSyncOptions(prev => ({ ...prev, syncInterval: value }))}
                  >
                    <SelectTrigger id="sync-interval">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sync-time">Sync Time</Label>
                  <Input
                    id="sync-time"
                    type="time"
                    value={syncOptions.syncTime}
                    onChange={(e) => setSyncOptions(prev => ({ ...prev, syncTime: e.target.value }))}
                  />
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Next sync: {syncOptions.syncInterval === 'daily' ? 'Tomorrow' : 'In 1 hour'} at {syncOptions.syncTime}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={() => {
            setActiveProvider(null);
            setShowAuthForm(false);
          }}>
            Cancel
          </Button>
          <Button 
            onClick={authorizeWithProvider}
            disabled={!authDetails.clientId || !authDetails.redirectUri || isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>Connect</>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // If a provider is active, show file browser
  if (activeProvider && authResult) {
    return (
      <Card className="w-full shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {cloudProviders[activeProvider].icon}
              <CardTitle>
                {cloudProviders[activeProvider].name}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {syncOptions.autoSync && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Auto-sync {syncOptions.syncInterval}
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={disconnect}>Disconnect</Button>
            </div>
          </div>
          <CardDescription>Browse and select files to import</CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Search and navigation bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {folderHistory.length > 0 && (
                <Button variant="ghost" size="sm" onClick={navigateBack}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              )}
              <div className="text-sm">
                {currentFolder === null ? 'Root' : 'Folder: ' + (folderHistory.length > 0 ? folderHistory[folderHistory.length - 1].name : '')}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-[200px]"
              />
              <Button size="sm" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Files and folders */}
          <div className="space-y-2">
            {isLoading ? (
              // Loading skeletons
              Array.from({length: 3}).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 border rounded-md">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full max-w-[200px]" />
                    <Skeleton className="h-3 w-16 mt-1" />
                  </div>
                </div>
              ))
            ) : files.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No files found in this location
              </div>
            ) : (
              files.map(file => (
                <div 
                  key={file.id} 
                  className={`flex items-center gap-3 p-2 border rounded-md hover:bg-muted/30 transition-colors cursor-pointer ${
                    selectedFiles.some(f => f.id === file.id) ? 'bg-primary/5 border-primary/20' : 'border-transparent'
                  }`}
                  onClick={() => file.isFolder ? navigateToFolder(file) : toggleFileSelection(file)}
                >
                  <div className="h-8 w-8 flex items-center justify-center rounded">
                    {file.isFolder ? (
                      <FolderOpen className="h-5 w-5 text-blue-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {file.isFolder ? 'Folder' : formatFileSize(file.size)}
                    </div>
                  </div>
                  {selectedFiles.some(f => f.id === file.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
        
        <CardFooter className="pt-3 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected
          </div>
          <Button 
            disabled={selectedFiles.length === 0 || downloading}
            onClick={downloadSelectedFiles}
            size="sm"
          >
            {downloading ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Import Files
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Provider selection screen with minimalistic design
  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle>Connect to Cloud Storage</CardTitle>
        <CardDescription>
          Select a storage provider to import files from
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.entries(cloudProviders) as [CloudStorageProvider, CloudProviderConfig][])
            .slice(0, 3) // Only show first 3 providers
            .map(([provider, config]) => (
              <button
                key={provider}
                onClick={() => connectToProvider(provider)}
                className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/30 transition-all duration-200"
              >
                <div className={`w-12 h-12 rounded-full bg-${config.color}-50 flex items-center justify-center mb-3`}>
                  {config.icon}
                </div>
                <h3 className="font-medium">{config.name}</h3>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  {config.description}
                </p>
              </button>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CloudStorageConnector;
