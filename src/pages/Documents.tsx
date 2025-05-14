
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ProcessTransactions from "@/components/processing/ProcessTransactions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "@/components/ingestion/FileUpload";

const Documents = () => {
  const [currentTab, setCurrentTab] = useState("transactions");
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <Tabs 
          defaultValue="transactions" 
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
