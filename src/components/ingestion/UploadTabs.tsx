
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DropZone from './DropZone';
import CloudStorageConnector from './CloudStorageConnector';

interface UploadTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onFilesSelected: (files: File[]) => void;
  onCloudFilesSelected: (files: File[]) => void;
  autoSync: boolean;
  setAutoSync: (value: boolean) => void;
}

const UploadTabs: React.FC<UploadTabsProps> = ({
  activeTab,
  setActiveTab,
  onFilesSelected,
  onCloudFilesSelected,
  autoSync,
  setAutoSync
}) => {
  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid grid-cols-2 w-64">
            <TabsTrigger value="upload">Local Upload</TabsTrigger>
            <TabsTrigger value="cloud">Cloud Storage</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="upload" className="mt-0 pt-0">
          <DropZone onFilesSelected={onFilesSelected} />
        </TabsContent>
        
        <TabsContent value="cloud" className="mt-0 pt-0">
          <CloudStorageConnector onFilesSelected={onCloudFilesSelected} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UploadTabs;
