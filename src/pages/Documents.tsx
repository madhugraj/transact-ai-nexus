import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table } from "lucide-react";
import ProcessingTab from "@/components/processing/ProcessingTab";
import TableExtractionPage from "@/components/ingestion/TableExtractionPage";
import { syncLocalStorageWithSupabase } from "@/services/supabase/syncService";

const Documents = () => {
  const [activeTab, setActiveTab] = useState<string>("tableExtraction");
  
  // Sync local storage tables with Supabase on load
  useEffect(() => {
    const syncData = async () => {
      try {
        await syncLocalStorageWithSupabase();
      } catch (error) {
        console.error('Error syncing with Supabase:', error);
      }
    };
    
    syncData();
  }, []);
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col mb-6">
          <h1 className="text-3xl font-semibold">Document Processing</h1>
          <p className="text-muted-foreground mt-1">
            Process and analyze financial documents using our agent system with Gemini AI
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="processing">Agent Processing</TabsTrigger>
            <TabsTrigger value="tableExtraction" className="flex items-center gap-1">
              <Table className="h-3.5 w-3.5" /> Table Extraction
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="processing" className="mt-4">
            <Card className="overflow-hidden border-muted/40 shadow-sm hover:shadow-md transition-all duration-200 p-6">
              <ProcessingTab />
            </Card>
          </TabsContent>
          
          <TabsContent value="tableExtraction" className="mt-4">
            <TableExtractionPage />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Documents;
