
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import ProcessingTab from "@/components/processing/ProcessingTab";
import TableExtraction from "@/components/ingestion/GeminiVisionTest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Documents = () => {
  const [activeTab, setActiveTab] = useState<string>("tableExtraction");
  const { toast } = useToast();
  
  const handleDownload = () => {
    // Placeholder for download functionality
    toast({
      title: "Download initiated",
      description: "Your document is being prepared for download",
    });
    
    // In a real implementation, this would trigger an actual download
    // For demonstration purposes, we're just showing a toast
  };
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold">Document Processing</h1>
            <p className="text-muted-foreground mt-1">
              Process and analyze financial documents using our agent system with Gemini AI
            </p>
          </div>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            Download Results
          </Button>
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
            <TableExtraction />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Documents;
