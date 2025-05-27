
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import TableExtraction from "@/components/ingestion/GeminiVisionTest";
import { Button } from "@/components/ui/button";
import { Download, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentComparison from "@/components/document-comparison/DocumentComparison";
import AIAssistant from "@/components/assistant/AIAssistant";
import { InventoryMappingPanel } from "@/components/inventory/InventoryMappingPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Documents = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("tableExtraction");
  const [showAssistant, setShowAssistant] = useState(false);

  const handleDownload = () => {
    toast({
      title: "Download initiated",
      description: "Your document is being prepared for download"
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-primary">Document Processing</h1>
            <p className="text-muted-foreground mt-1">
              Process, analyze, and compare financial documents
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Download Results
            </Button>
            
            <Button variant="ghost" size="icon" onClick={() => setShowAssistant(true)} className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 text-primary" title="Document AI Assistant">
              <Bot className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="tableExtraction" className="text-xs">Table Extraction</TabsTrigger>
            <TabsTrigger value="documentComparison" className="text-xs">Document Comparison</TabsTrigger>
            <TabsTrigger value="inventoryMapping" className="text-xs">Inventory Mapping</TabsTrigger>
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
          
          <TabsContent value="inventoryMapping" className="mt-4">
            <Card className="overflow-hidden border-muted/40 shadow-sm hover:shadow-md transition-all duration-200 p-6">
              <InventoryMappingPanel />
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="text-center text-xs text-muted-foreground mt-12 pt-4 border-t">
          Copyright © 2025 yavar Techworks Pte Ltd., All rights reserved
        </div>
      </div>

      <Dialog open={showAssistant} onOpenChange={setShowAssistant}>
        <DialogContent className="sm:max-w-[600px] p-0">
          <DialogHeader className="px-4 py-2 border-b">
            <DialogTitle className="text-blue-700">Ziva</DialogTitle>
          </DialogHeader>
          <div className="p-0">
            <AIAssistant />
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Documents;
