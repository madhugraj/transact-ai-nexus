
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DropZone from './DropZone';
import CloudStorageConnector from './CloudStorageConnector';

interface UploadTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onFilesSelected: (files: File[]) => void;
  onCloudFilesSelected: (files: File[]) => void;
}

const UploadTabs: React.FC<UploadTabsProps> = ({
  activeTab,
  setActiveTab,
  onFilesSelected,
  onCloudFilesSelected
}) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
      <TabsList className="grid grid-cols-2">
        <TabsTrigger value="upload">Local Upload</TabsTrigger>
        <TabsTrigger value="cloud">Cloud Storage</TabsTrigger>
      </TabsList>
      
      <TabsContent value="upload" className="mt-0 pt-0">
        <DropZone onFilesSelected={onFilesSelected} />
      </TabsContent>
      
      <TabsContent value="cloud" className="mt-0 pt-0">
        <CloudStorageConnector onFilesSelected={onCloudFilesSelected} />
      </TabsContent>
    </Tabs>
  );
};

export default UploadTabs;
