
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import GoogleDriveConnector from './GoogleDriveConnector';
import { useToast } from '@/hooks/use-toast';

interface CloudStorageConnectorProps {
  onFilesSelected: (files: File[]) => void;
}

const CloudStorageConnector = ({ onFilesSelected }: CloudStorageConnectorProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  console.log('CloudStorageConnector: onFilesSelected callback received');

  const handleGoogleDriveFilesSelected = (files: File[]) => {
    console.log('CloudStorageConnector: Google Drive files selected:', files.length);
    setSelectedFiles(files);
    onFilesSelected(files);
    
    if (files.length > 0) {
      toast({
        title: "Files Selected",
        description: `${files.length} files selected from Google Drive. You can now process them.`
      });
    }
  };

  return (
    <div className="space-y-4">
      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground mb-2">
              {selectedFiles.length} files selected and ready for processing
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <span key={index} className="px-2 py-1 bg-muted rounded text-xs">
                  {file.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="google_drive" className="w-full">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="google_drive">Google Drive</TabsTrigger>
          <TabsTrigger value="onedrive">OneDrive</TabsTrigger>
          <TabsTrigger value="sharepoint">SharePoint</TabsTrigger>
          <TabsTrigger value="dropbox">Dropbox</TabsTrigger>
        </TabsList>
        
        <TabsContent value="google_drive" className="mt-4">
          <GoogleDriveConnector onFilesSelected={handleGoogleDriveFilesSelected} />
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
