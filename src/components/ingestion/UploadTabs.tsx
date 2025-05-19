
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "./FileUpload";
import EmailConnector from "./EmailConnector";
import CloudStorageConnector from "./CloudStorageConnector";
import SapDataImport from "./SapDataImport";

interface UploadTabsProps {
  onUploadComplete?: () => void;
}

export default function UploadTabs({ onUploadComplete }: UploadTabsProps) {
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
        <CloudStorageConnector />
      </TabsContent>
      
      <TabsContent value="sap">
        <SapDataImport />
      </TabsContent>
    </Tabs>
  );
}
