
import SapDataImport from "@/components/ingestion/SapDataImport";
import AppLayout from "@/components/layout/AppLayout";

const SapDataPage = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col mb-6">
          <h1 className="text-3xl font-semibold">SAP Data</h1>
          <p className="text-muted-foreground mt-1">
            Import and analyze SAP material movement data
          </p>
        </div>
        <SapDataImport />
      </div>
    </AppLayout>
  );
};

export default SapDataPage;
