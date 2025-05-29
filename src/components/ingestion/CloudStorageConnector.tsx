import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import GoogleDriveConnector from './GoogleDriveConnector';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
      <Tabs defaultValue="google_drive" className="w-full">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="google_drive">Google Drive</TabsTrigger>
          <TabsTrigger value="onedrive">OneDrive</TabsTrigger>
          <TabsTrigger value="sharepoint">SharePoint</TabsTrigger>
          <TabsTrigger value="dropbox">Dropbox</TabsTrigger>
        </TabsList>
        
        <TabsContent value="google_drive" className="mt-4">
          <GoogleDriveConnector onFilesSelected={onFilesSelected} />
        </TabsContent>
        
        <TabsContent value="onedrive" className="mt-4">
          <Card className="p-6 text-center text-muted-foreground">
            OneDrive integration coming soon...
          </Card>
        </TabsContent>
        
        <TabsContent value="sharepoint" className="mt-4">
          <Card className="p-6 text-center text-muted-foreground">
            SharePoint integration coming soon...
          </Card>
        </TabsContent>
        
        <TabsContent value="dropbox" className="mt-4">
          <Card className="p-6 text-center text-muted-foreground">
            Dropbox integration coming soon...
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CloudStorageConnector;
