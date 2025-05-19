
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import CloudStorageConnector from "@/components/ingestion/CloudStorageConnector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "lucide-react";

const Upload = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleCloudFilesSelected = (files: File[]) => {
    console.log("Upload page: Cloud files selected:", files.length);
    setSelectedFiles(files);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold">Cloud Storage</h1>
            <p className="text-muted-foreground mt-1">
              Connect to cloud services and import your documents
            </p>
          </div>
        </div>
        
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileUpload className="h-5 w-5 text-primary" />
              Cloud Storage Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <CloudStorageConnector 
              onFilesSelected={handleCloudFilesSelected}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Upload;
