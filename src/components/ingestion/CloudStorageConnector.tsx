
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import GoogleDriveConnector from './GoogleDriveConnector';

interface CloudStorageConnectorProps {
  onFilesSelected: (files: File[]) => void;
}

const CloudStorageConnector = ({ onFilesSelected }: CloudStorageConnectorProps) => {
  console.log('CloudStorageConnector: onFilesSelected callback received');

  const handleGoogleDriveFilesSelected = (files: File[]) => {
    console.log('CloudStorageConnector: Google Drive files selected:', files.length);
    onFilesSelected(files);
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
