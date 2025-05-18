
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import TableExtraction from "@/components/ingestion/GeminiVisionTest";
import { Button } from "@/components/ui/button";
import { Download, Compare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentComparison from "@/components/document-comparison/DocumentComparison";

const Documents = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("tableExtraction");
  
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
              Process, analyze, and compare financial documents using our Gemini AI
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
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="tableExtraction">Table Extraction</TabsTrigger>
            <TabsTrigger value="documentComparison">Document Comparison</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tableExtraction" className="mt-4">
            <Card className="overflow-hidden border-muted/40 shadow-sm hover:shadow-md transition-all duration-200 p-6">
              <TableExtraction />
            </Card>
          </TabsContent>
          
          <TabsContent value="documentComparison" className="mt-4">
            <Card className="overflow-hidden border-muted/40 shadow-sm hover:shadow-md transition-all duration-200 p-6">
              <DocumentComparison />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Documents;
