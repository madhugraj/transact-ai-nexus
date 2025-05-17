
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Google, Microsoft, SharePoint, Cloud, FileText } from 'lucide-react';
import * as api from '@/services/api';

interface CloudStorageConnectorProps {
  onFilesSelected: (files: File[]) => void;
}

const CloudStorageConnector: React.FC<CloudStorageConnectorProps> = ({ onFilesSelected }) => {
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [activeProvider, setActiveProvider] = useState<api.CloudStorageProvider | null>(null);
  const [files, setFiles] = useState<api.CloudFile[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const { toast } = useToast();

  // Connect to cloud storage
  const connectToStorage = async (provider: api.CloudStorageProvider) => {
    setIsConnecting(true);
    setActiveProvider(provider);
    
    try {
      const response = await api.connectToCloudStorage(provider);
      
      if (response.success) {
        toast({
          title: `Connected to ${getProviderName(provider)}`,
          description: "You can now browse and select files",
        });
        
        // After successful connection, list files
        listFiles(provider);
      } else {
        toast({
          title: "Connection failed",
          description: response.error || `Could not connect to ${getProviderName(provider)}`,
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

  // List files from connected storage
  const listFiles = async (provider: api.CloudStorageProvider) => {
    try {
      const response = await api.listCloudStorageFiles({ provider });
      
      if (response.success && response.data) {
        setFiles(response.data.files);
      } else {
        toast({
          title: "Failed to list files",
          description: response.error || "Could not retrieve files from storage",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error listing files",
        description: error instanceof Error ? error.message : "An error occurred while fetching files",
        variant: "destructive",
      });
    }
  };

  // Toggle file selection
  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };

  // Import selected files
  const importSelectedFiles = async () => {
    if (selectedFileIds.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to import",
      });
      return;
    }

    const selectedFilesToImport = files.filter(file => selectedFileIds.includes(file.id));
    const importedFiles: File[] = [];
    
    for (const file of selectedFilesToImport) {
      try {
        const response = await api.downloadCloudFile({ provider: activeProvider! }, file.id);
        
        if (response.success && response.data) {
          const newFile = new File([response.data], file.name, { type: file.mimeType });
          importedFiles.push(newFile);
        } else {
          toast({
            title: `Failed to download ${file.name}`,
            description: response.error || "Could not download file",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: `Error downloading ${file.name}`,
          description: error instanceof Error ? error.message : "An error occurred during download",
          variant: "destructive",
        });
      }
    }
    
    if (importedFiles.length > 0) {
      onFilesSelected(importedFiles);
      toast({
        title: "Files imported",
        description: `Successfully imported ${importedFiles.length} file(s)`,
      });
      setSelectedFileIds([]);
    }
  };

  // Get provider display name
  const getProviderName = (provider: api.CloudStorageProvider): string => {
    switch (provider) {
      case 'google-drive':
        return 'Google Drive';
      case 'onedrive':
        return 'OneDrive';
      case 'sharepoint':
        return 'SharePoint';
      case 'local':
      default:
        return 'Local Storage';
    }
  };

  // Get provider icon
  const getProviderIcon = (provider: api.CloudStorageProvider) => {
    switch (provider) {
      case 'google-drive':
        return <Google className="h-5 w-5" />;
      case 'onedrive':
        return <Microsoft className="h-5 w-5" />;
      case 'sharepoint':
        return <SharePoint className="h-5 w-5" />;
      case 'local':
      default:
        return <Cloud className="h-5 w-5" />;
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Connect to Cloud Storage</CardTitle>
      </CardHeader>
      <CardContent>
        {!activeProvider ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              className="flex flex-col h-24 items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              onClick={() => connectToStorage('google-drive')}
              disabled={isConnecting}
            >
              <Google className="h-8 w-8 text-blue-600" />
              <span>Google Drive</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col h-24 items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              onClick={() => connectToStorage('onedrive')}
              disabled={isConnecting}
            >
              <Microsoft className="h-8 w-8 text-blue-600" />
              <span>OneDrive</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col h-24 items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              onClick={() => connectToStorage('sharepoint')}
              disabled={isConnecting}
            >
              <SharePoint className="h-8 w-8 text-blue-600" />
              <span>SharePoint</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getProviderIcon(activeProvider)}
                <span className="font-medium">{getProviderName(activeProvider)}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveProvider(null)}
              >
                Disconnect
              </Button>
            </div>
            
            {/* File list */}
            <div className="border rounded-md">
              <div className="p-2 bg-muted/30 border-b flex justify-between items-center">
                <span className="text-sm font-medium">Available Files</span>
                <span className="text-sm text-muted-foreground">{files.length} files</span>
              </div>
              
              {files.length > 0 ? (
                <div className="max-h-64 overflow-y-auto">
                  {files.map(file => (
                    <div 
                      key={file.id}
                      onClick={() => toggleFileSelection(file.id)}
                      className={`p-3 border-b last:border-b-0 flex items-center cursor-pointer hover:bg-muted/30 ${
                        selectedFileIds.includes(file.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={selectedFileIds.includes(file.id)}
                        onChange={() => {}}
                        className="mr-3"
                      />
                      <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-sm truncate">{file.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No files available
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={importSelectedFiles}
                disabled={selectedFileIds.length === 0}
              >
                Import Selected ({selectedFileIds.length})
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CloudStorageConnector;
