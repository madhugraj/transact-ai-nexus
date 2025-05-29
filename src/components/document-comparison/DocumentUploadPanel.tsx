
import React, { useRef } from "react";
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
  const documentProcessorRef = useRef<DocumentProcessor | null>(null);

  // Initialize processor once
  if (!documentProcessorRef.current) {
    documentProcessorRef.current = new DocumentProcessor(toast);
  }

  const handleSourceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("📁 Source file change triggered");
    const file = e.target.files?.[0];
    if (file && documentProcessorRef.current) {
      console.log("📁 New source file selected:", file.name);
      
      // Clear any existing source document ID to force reprocessing
      documentProcessorRef.current.setCurrentSourceDocumentId(null);
      
      // Update the parent state first
      handlePoFileChange(e);
      
      // Process the document
      await documentProcessorRef.current.processSourceDocument(file);
      
      console.log("✅ Source document processed, ID:", documentProcessorRef.current.getCurrentSourceDocumentId());
    }
    
    // Clear the input value to allow re-selecting the same file
    e.target.value = '';
  };

  const handleTargetFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("📁 Target file change triggered");
    const files = e.target.files;
    if (files && files.length > 0 && documentProcessorRef.current) {
      const fileArray = Array.from(files);
      console.log("📁 New target files selected:", fileArray.length, "files");
      
      // Check if we have a source document first
      const sourceDocId = documentProcessorRef.current.getCurrentSourceDocumentId();
      console.log("🔍 Current source document ID:", sourceDocId);
      
      if (!sourceDocId) {
        toast({
          title: "Source Document Required",
          description: "Please upload and process a source document first",
          variant: "destructive",
        });
        e.target.value = '';
        return;
      }
      
      if (fileArray.length > 5) {
        toast({
          title: "Too Many Files",
          description: "Please select a maximum of 5 target documents",
          variant: "destructive",
        });
        e.target.value = '';
        return;
      }

      // Update the parent state first
      handleInvoiceFileChange(e);
      
      // Process the documents
      await documentProcessorRef.current.processTargetDocuments(fileArray);
    }
    
    // Clear the input value to allow re-selecting files
    e.target.value = '';
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
