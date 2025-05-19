
import UploadTabs from "@/components/ingestion/UploadTabs";
import AppLayout from "@/components/layout/AppLayout";

const Upload = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold">File Upload</h1>
            <p className="text-muted-foreground mt-1">
              Upload and process your financial documents
            </p>
          </div>
        </div>
        
        {/* Using UploadTabs to show all available connectors */}
        <UploadTabs />
      </div>
    </AppLayout>
  );
};

export default Upload;
