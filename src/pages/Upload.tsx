
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
        
        {/* Component handles its own tabs internally */}
        <FileUpload />
      </div>
    </AppLayout>
  );
};

export default Upload;
