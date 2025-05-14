
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import ProcessTransactions from "@/components/processing/ProcessTransactions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "@/components/ingestion/FileUpload";
import { FileText, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";

const Documents = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [currentTab, setCurrentTab] = useState(tabParam === "upload" ? "upload" : "transactions");
  
  // Update tab when URL parameters change
  useEffect(() => {
    if (tabParam === "upload") {
      setCurrentTab("upload");
    } else if (tabParam === "transactions") {
      setCurrentTab("transactions");
    }
  }, [tabParam]);
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col mb-6">
          <h1 className="text-3xl font-semibold">Document Processing</h1>
          <p className="text-muted-foreground mt-1">
            Upload, process and analyze financial documents
          </p>
        </div>
        
        <Card className="overflow-hidden border-muted/40 shadow-sm hover:shadow-md transition-all duration-200">
          <Tabs 
            value={currentTab}
            onValueChange={setCurrentTab}
            className="w-full"
          >
            <TabsList className="w-full bg-muted/30 rounded-none border-b">
              <TabsTrigger 
                value="transactions" 
                className="flex items-center gap-2 py-3 px-5 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                <FileText className="w-4 h-4" />
                Process Transactions
              </TabsTrigger>
              <TabsTrigger 
                value="upload" 
                className="flex items-center gap-2 py-3 px-5 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                <Upload className="w-4 h-4" />
                File Upload
              </TabsTrigger>
            </TabsList>
            
            <div className="p-6">
              <TabsContent value="transactions" className="mt-0 p-0">
                <ProcessTransactions />
              </TabsContent>
              
              <TabsContent value="upload" className="mt-0 p-0">
                <FileUpload />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Documents;
