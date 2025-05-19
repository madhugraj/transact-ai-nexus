
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "./FileUpload";
import EmailConnector from "./EmailConnector";
import CloudStorageConnector from "./CloudStorageConnector";
import SapDataImport from "./SapDataImport";

// Updated interface to include all required props
export interface UploadTabsProps {
  onUploadComplete?: () => void;
  onFilesSelected?: (files: File[]) => void;
  onCloudFilesSelected?: (files: File[]) => void;
  autoSync?: boolean;
  setAutoSync?: (value: boolean) => void;
}

export default function UploadTabs({ 
  onUploadComplete,
  onFilesSelected,
  onCloudFilesSelected,
  autoSync,
  setAutoSync
}: UploadTabsProps) {
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-4 w-full">
        <TabsTrigger value="upload">File Upload</TabsTrigger>
        <TabsTrigger value="email">Email Inbox</TabsTrigger>
        <TabsTrigger value="cloud">Cloud Storage</TabsTrigger>
        <TabsTrigger value="sap">SAP Import</TabsTrigger>
      </TabsList>
      
      <TabsContent value="upload">
        <FileUpload onUploadComplete={onUploadComplete} />
      </TabsContent>
      
      <TabsContent value="email">
        <EmailConnector />
      </TabsContent>
      
      <TabsContent value="cloud">
        <CloudStorageConnector 
          onFilesSelected={onCloudFilesSelected || (() => {})}
        />
      </TabsContent>
      
      <TabsContent value="sap">
        <SapDataImport />
      </TabsContent>
    </Tabs>
  );
}
