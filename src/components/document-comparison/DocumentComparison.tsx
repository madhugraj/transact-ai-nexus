
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSearch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DocumentUploadPanel } from "./DocumentUploadPanel";
import { ComparisonResultsPanel } from "./ComparisonResultsPanel";

// Types for document comparison
interface DocumentDetails {
  vendor?: string;
  amount?: number;
  quantity?: string;
  date?: string;
  documentNumber?: string;
}

export interface ComparisonResult {
  field: string;
  poValue: string | number;
  invoiceValue: string | number;
  match: boolean;
}

const DocumentComparison = () => {
  const { toast } = useToast();
  const [poFile, setPoFile] = useState<File | null>(null);
  const [invoiceFiles, setInvoiceFiles] = useState<File[]>([]);
  const [activeInvoiceIndex, setActiveInvoiceIndex] = useState<number>(0);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [matchPercentage, setMatchPercentage] = useState<number>(0);
  const [activeTab, setActiveTab] = useState("upload");

  // Handle PO file selection
  const handlePoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPoFile(e.target.files[0]);
      toast({
        title: "PO Uploaded",
        description: `Successfully uploaded ${e.target.files[0].name}`,
      });
    }
  };

  // Handle Invoice file selection
  const handleInvoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setInvoiceFiles(prev => [...prev, ...newFiles]);
      toast({
        title: "Invoice(s) Uploaded",
        description: `Successfully uploaded ${newFiles.length} invoice(s)`,
      });
    }
  };

  // Remove invoice file
  const removeInvoiceFile = (index: number) => {
    setInvoiceFiles(invoiceFiles.filter((_, i) => i !== index));
    if (activeInvoiceIndex === index) {
      setActiveInvoiceIndex(0);
    }
  };

  // Compare documents - using the exact example provided by the user
  const compareDocuments = () => {
    if (!poFile || invoiceFiles.length === 0) {
      toast({
        title: "Missing Documents",
        description: "Please upload both PO and at least one Invoice",
        variant: "destructive",
      });
      return;
    }

    setIsComparing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      // Use the exact example data provided
      const mockResults: ComparisonResult[] = [
        { field: "Vendor", poValue: "Apex Financial Corp", invoiceValue: "Apex Financial", match: false },
        { field: "Amount", poValue: 54000, invoiceValue: 54400, match: false },
        { field: "Quantity", poValue: "1 license, 20 hours", invoiceValue: "1 license, 22 hours", match: false },
        { field: "Date", poValue: "2023-05-15", invoiceValue: "2023-05-16", match: false },
        { field: "Document Number", poValue: "PO-2025-001", invoiceValue: "INV-2025-789", match: false }
      ];
      
      // All fields mismatch as per example
      const percentage = 68;
      
      setComparisonResults(mockResults);
      setMatchPercentage(percentage);
      setIsComparing(false);
      setActiveTab("results");
      
      toast({
        title: "Comparison Complete",
        description: `Documents compared with ${percentage}% match`,
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          <TabsTrigger value="results" disabled={comparisonResults.length === 0}>
            Comparison Results
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="mt-4 space-y-4">
          <DocumentUploadPanel 
            poFile={poFile}
            invoiceFiles={invoiceFiles}
            handlePoFileChange={handlePoFileChange}
            handleInvoiceFileChange={handleInvoiceFileChange}
            removeInvoiceFile={removeInvoiceFile}
            compareDocuments={compareDocuments}
            isComparing={isComparing}
          />
        </TabsContent>
        
        <TabsContent value="results" className="mt-4 space-y-4">
          {comparisonResults.length > 0 && (
            <ComparisonResultsPanel
              poFile={poFile}
              invoiceFiles={invoiceFiles}
              activeInvoiceIndex={activeInvoiceIndex}
              setActiveInvoiceIndex={setActiveInvoiceIndex}
              comparisonResults={comparisonResults}
              matchPercentage={matchPercentage}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentComparison;
