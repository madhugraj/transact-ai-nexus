
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import ProcessTransactions from "@/components/processing/ProcessTransactions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "@/components/ingestion/FileUpload";

const Documents = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [currentTab, setCurrentTab] = useState(tabParam === "upload" ? "upload" : "transactions");
  
  // Update tab when URL parameters change
  useEffect(() => {
    if (tabParam === "upload") {
      setCurrentTab("upload");
    }
  }, [tabParam]);
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Document Processing</h1>
        
        <Tabs 
          value={currentTab}
          onValueChange={setCurrentTab}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="transactions">Process Transactions</TabsTrigger>
            <TabsTrigger value="upload">File Upload</TabsTrigger>
          </TabsList>
          
          <TabsContent value="transactions" className="space-y-4">
            <ProcessTransactions />
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-4">
            <FileUpload />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Documents;
