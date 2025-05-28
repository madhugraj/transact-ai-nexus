
import React from "react";
import { Button } from "@/components/ui/button";
import { FileSearch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SourceDocumentUpload } from "./upload/SourceDocumentUpload";
import { TargetDocumentsUpload } from "./upload/TargetDocumentsUpload";
import { DocumentProcessor } from "./upload/DocumentProcessor";

interface DocumentUploadPanelProps {
  poFile: File | null;
  invoiceFiles: File[];
  handlePoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInvoiceFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeInvoiceFile: (index: number) => void;
  compareDocuments: () => void;
  isComparing: boolean;
}

export const DocumentUploadPanel: React.FC<DocumentUploadPanelProps> = ({
  poFile,
  invoiceFiles,
  handlePoFileChange,
  handleInvoiceFileChange,
  removeInvoiceFile,
  compareDocuments,
  isComparing
}) => {
  const { toast } = useToast();
  const documentProcessor = new DocumentProcessor(toast);

  const handleSourceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("📁 New source file selected:", file.name);
      handlePoFileChange(e);
      await documentProcessor.processSourceDocument(file);
    }
  };

  const handleTargetFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      console.log("📁 New target files selected:", fileArray.length, "files");
      
      if (fileArray.length > 5) {
        toast({
          title: "Too Many Files",
          description: "Please select a maximum of 5 target documents",
          variant: "destructive",
        });
        return;
      }

      handleInvoiceFileChange(e);
      await documentProcessor.processTargetDocuments(fileArray);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <SourceDocumentUpload 
        poFile={poFile}
        onFileChange={handleSourceFileChange}
      />
      
      <TargetDocumentsUpload 
        invoiceFiles={invoiceFiles}
        onFileChange={handleTargetFileChange}
        onRemoveFile={removeInvoiceFile}
      />
      
      <div className="md:col-span-2 flex justify-center">
        <Button 
          size="lg" 
          className="gap-2" 
          disabled={!poFile || invoiceFiles.length === 0 || isComparing} 
          onClick={compareDocuments}
        >
          <FileSearch className="h-5 w-5" />
          {isComparing ? "Processing..." : "Compare Documents"}
        </Button>
      </div>
    </div>
  );
};
