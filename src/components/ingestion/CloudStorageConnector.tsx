
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { CloudFile, CloudStorageProvider, CloudStorageAuthResult } from '@/types/cloudStorage';
import * as api from '@/services/api';
import { Loader, Search, FolderOpen, ArrowLeft, FileIcon, Download, UploadCloud } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// Cloud provider icons (using available Lucide icons)
const CloudProviderIcon = ({ provider }: { provider: CloudStorageProvider }) => {
  switch (provider) {
    case 'google-drive':
      return <UploadCloud className="text-blue-500" />;
    case 'onedrive':
      <UploadCloud className="text-blue-600" />;
    case 'sharepoint':
      return <UploadCloud className="text-green-600" />;
    case 'dropbox':
      return <UploadCloud className="text-blue-400" />;
    case 'box':
      return <UploadCloud className="text-blue-700" />;
    default:
      return <FileIcon />;
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

  // Connect to a cloud storage provider
  const connectToProvider = async (provider: CloudStorageProvider) => {
    setIsConnecting(true);
    setActiveProvider(provider);
    
    try {
      const response = await api.connectToCloudStorage(provider, {
        redirectUri: window.location.origin + '/auth/callback',
      });
      
      if (response.success && response.data) {
        setAuthResult(response.data);
        toast({
          title: "Connected successfully",
          description: `Connected to ${provider} successfully.`,
        });
        
        // Load files from root
        loadFiles(provider, null);
      } else {
        toast({
          title: "Connection failed",
          description: response.error || `Failed to connect to ${provider}.`,
          variant: "destructive",
        });
        setActiveProvider(null);
      }
    } catch (error) {
      toast({
        title: "Connection error",
        description: error instanceof Error ? error.message : "An error occurred during connection",
        variant: "destructive",
      });
      setActiveProvider(null);
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
          title: "Files downloaded",
          description: `Successfully downloaded ${downloadedFiles.length} files.`,
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
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // If a provider is active, show file browser
  if (activeProvider && authResult) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudProviderIcon provider={activeProvider} />
              <CardTitle>
                {activeProvider.charAt(0).toUpperCase() + activeProvider.slice(1).replace('-', ' ')}
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={disconnect}>Disconnect</Button>
          </div>
          <CardDescription>Browse and select files to upload</CardDescription>
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
              <div>
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
              Array.from({length: 5}).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 border rounded-md">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full max-w-[200px]" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </div>
                </div>
              ))
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No files found in this location
              </div>
            ) : (
              files.map(file => (
                <div 
                  key={file.id} 
                  className={`flex items-center gap-3 p-2 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer ${
                    selectedFiles.some(f => f.id === file.id) ? 'bg-primary/10 border-primary/30' : ''
                  }`}
                  onClick={() => file.isFolder ? navigateToFolder(file) : toggleFileSelection(file)}
                >
                  <div className="h-10 w-10 flex items-center justify-center bg-muted rounded">
                    {file.isFolder ? (
                      <FolderOpen className="h-6 w-6 text-blue-500" />
                    ) : (
                      <FileIcon className="h-6 w-6 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {file.isFolder ? 'Folder' : formatFileSize(file.size)}
                    </div>
                  </div>
                  {selectedFiles.some(f => f.id === file.id) && (
                    <Badge variant="secondary">Selected</Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
        
        <CardFooter className="pt-3 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {selectedFiles.length} files selected
          </div>
          <Button 
            disabled={selectedFiles.length === 0 || downloading}
            onClick={downloadSelectedFiles}
          >
            {downloading ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Import Selected Files
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Provider selection screen
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Connect to Cloud Storage</CardTitle>
        <CardDescription>
          Select a cloud storage provider to import files from
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="google-drive" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="google-drive">Google Drive</TabsTrigger>
            <TabsTrigger value="onedrive">OneDrive</TabsTrigger>
            <TabsTrigger value="sharepoint">SharePoint</TabsTrigger>
          </TabsList>
          
          <TabsContent value="google-drive" className="space-y-4">
            <div className="text-center py-6 space-y-4">
              <UploadCloud className="h-16 w-16 mx-auto text-blue-500" />
              <div>
                <h3 className="font-medium text-lg">Google Drive</h3>
                <p className="text-muted-foreground text-sm">Connect to your Google Drive account to import files</p>
              </div>
              <Button 
                onClick={() => connectToProvider('google-drive')}
                disabled={isConnecting}
                className="w-full max-w-[200px]"
              >
                {isConnecting && activeProvider === 'google-drive' ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Connect to Google Drive
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="onedrive" className="space-y-4">
            <div className="text-center py-6 space-y-4">
              <UploadCloud className="h-16 w-16 mx-auto text-blue-600" />
              <div>
                <h3 className="font-medium text-lg">Microsoft OneDrive</h3>
                <p className="text-muted-foreground text-sm">Connect to your OneDrive account to import files</p>
              </div>
              <Button 
                onClick={() => connectToProvider('onedrive')}
                disabled={isConnecting}
                className="w-full max-w-[200px]"
              >
                {isConnecting && activeProvider === 'onedrive' ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Connect to OneDrive
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="sharepoint" className="space-y-4">
            <div className="text-center py-6 space-y-4">
              <UploadCloud className="h-16 w-16 mx-auto text-green-600" />
              <div>
                <h3 className="font-medium text-lg">SharePoint</h3>
                <p className="text-muted-foreground text-sm">Connect to your SharePoint site to import files</p>
              </div>
              <Button 
                onClick={() => connectToProvider('sharepoint')}
                disabled={isConnecting}
                className="w-full max-w-[200px]"
              >
                {isConnecting && activeProvider === 'sharepoint' ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Connect to SharePoint
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CloudStorageConnector;
