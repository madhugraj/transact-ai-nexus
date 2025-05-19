
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
  initialTab?: string;
}

export default function UploadTabs({ 
  onUploadComplete,
  onFilesSelected,
  onCloudFilesSelected,
  initialTab = "upload"
}: UploadTabsProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Handle file selection callback from FileUpload component
  const handleFilesSelected = (files: File[]) => {
    if (onFilesSelected && files.length > 0) {
      console.log("UploadTabs: forwarding selected files to parent", files.length);
      onFilesSelected(files);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-4 w-full">
        <TabsTrigger value="upload">File Upload</TabsTrigger>
        <TabsTrigger value="email">Email Inbox</TabsTrigger>
        <TabsTrigger value="cloud">Cloud Storage</TabsTrigger>
        <TabsTrigger value="sap">SAP Import</TabsTrigger>
      </TabsList>
      
      <TabsContent value="upload" className="mt-4">
        <FileUpload 
          onUploadComplete={onUploadComplete} 
          onFilesSelected={handleFilesSelected}
        />
      </TabsContent>
      
      <TabsContent value="email" className="mt-4">
        <EmailConnector />
      </TabsContent>
      
      <TabsContent value="cloud" className="mt-4">
        <CloudStorageConnector 
          onFilesSelected={onCloudFilesSelected || (() => {})}
        />
      </TabsContent>
      
      <TabsContent value="sap" className="mt-4">
        <SapDataImport />
      </TabsContent>
    </Tabs>
  );
}
