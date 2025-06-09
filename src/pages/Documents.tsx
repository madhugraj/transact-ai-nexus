
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentComparison from "@/components/document-comparison/DocumentComparison";
import POInvoiceComparison from "@/components/document-comparison/POInvoiceComparison";

const Documents = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Document Management</h1>
        <p className="text-muted-foreground">
          Compare and analyze your business documents
        </p>
      </div>
      
      <Tabs defaultValue="document-comparison" className="w-full">
        <TabsList>
          <TabsTrigger value="document-comparison">Document Comparison</TabsTrigger>
          <TabsTrigger value="po-invoice-comparison">PO vs Invoice Comparison</TabsTrigger>
        </TabsList>
        
        <TabsContent value="document-comparison">
          <DocumentComparison />
        </TabsContent>
        
        <TabsContent value="po-invoice-comparison">
          <POInvoiceComparison />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Documents;
