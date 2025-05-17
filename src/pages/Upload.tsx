import { Tabs } from "@/components/ui/tabs";
import FileUpload from "@/components/ingestion/FileUpload";
import AppLayout from "@/components/layout/AppLayout";

const Upload = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col mb-6">
          <h1 className="text-3xl font-semibold">File Upload</h1>
          <p className="text-muted-foreground mt-1">
            Upload and process your financial documents
          </p>
        </div>
        
        {/* We're keeping the Tabs wrapper, but the FileUpload component 
            now has its own internal Tabs for the upload/cloud tabs */}
        <FileUpload />
      </div>
    </AppLayout>
  );
};

export default Upload;
