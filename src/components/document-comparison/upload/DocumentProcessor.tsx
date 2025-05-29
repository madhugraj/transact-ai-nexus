
import { useToast } from "@/hooks/use-toast";
import { classifyDocument } from "./DocumentClassifier";
import { DatabaseManager } from "./DatabaseManager";

export class DocumentProcessor {
  private toast: any;
  private currentSourceDocumentId: number | null = null;
  private databaseManager: DatabaseManager;

  constructor(toast: any) {
    this.toast = toast;
    this.databaseManager = new DatabaseManager();
    console.log("🔧 DocumentProcessor initialized");
  }

  async processSourceDocument(file: File): Promise<void> {
    try {
      console.log("=== PROCESSING SOURCE DOCUMENT ===");
      console.log("📁 File:", file.name, "Size:", file.size, "Type:", file.type);
      
      const existsResult = await this.databaseManager.checkSourceDocumentExists(file.name);
      if (existsResult.exists) {
        this.currentSourceDocumentId = existsResult.id!;
        console.log("✅ Source document already exists with ID:", this.currentSourceDocumentId);
        
        await this.databaseManager.clearStaleTargetDocuments(this.currentSourceDocumentId);
        
        this.toast({
          title: "Document Already Processed",
          description: "This source document has already been processed. Previous target documents have been cleared.",
        });
        return;
      }
      
      this.toast({
        title: "Processing Document",
        description: "Analyzing document with AI...",
      });

      const extractedData = await classifyDocument(file);
      
      this.currentSourceDocumentId = await this.databaseManager.storeSourceDocument(
        file.name,
        extractedData.document_type || extractedData.classification || "Unknown",
        extractedData
      );
      
      this.toast({
        title: "Document Processed",
        description: `Successfully classified as: ${extractedData.document_type || extractedData.classification || "Unknown"}`,
      });

    } catch (error) {
      console.error("❌ Source document processing error:", error);
      this.currentSourceDocumentId = null;
      this.toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process document",
        variant: "destructive",
      });
      throw error;
    }
  }

  async processTargetDocuments(files: File[]): Promise<void> {
    try {
      console.log("=== PROCESSING TARGET DOCUMENTS ===");
      console.log("📁 Files to process:", files.length);
      console.log("🔍 Current source document ID:", this.currentSourceDocumentId);
      
      if (!this.currentSourceDocumentId) {
        const errorMsg = "Please upload and process a source document first";
        console.error("❌", errorMsg);
        this.toast({
          title: "Source Document Required",
          description: errorMsg,
          variant: "destructive",
        });
        throw new Error(errorMsg);
      }

      const fileNames = files.map(f => f.name);
      console.log("📋 Processing files:", fileNames);
      
      await this.databaseManager.clearStaleTargetDocuments(this.currentSourceDocumentId);
      console.log("🧹 Cleared any existing target documents for fresh start");
      
      this.toast({
        title: "Processing Target Documents",
        description: `Analyzing ${files.length} document(s)...`,
      });

      const processedDocs = [];

      for (const [index, file] of files.entries()) {
        console.log(`📄 Processing file ${index + 1}/${files.length}:`, file.name);
        
        const extractedData = await classifyDocument(file);
        console.log(`✅ File ${index + 1} processed:`, file.name);
        
        processedDocs.push({
          title: file.name,
          type: extractedData.document_type || extractedData.classification || "Unknown",
          json: extractedData
        });
      }

      await this.databaseManager.storeTargetDocuments(this.currentSourceDocumentId, processedDocs);

      console.log("✅ Target documents processed successfully");
      this.toast({
        title: "Target Documents Processed",
        description: `Successfully processed ${files.length} document(s)`,
      });

    } catch (error) {
      console.error("❌ Target documents processing error:", error);
      this.toast({
        title: "Target Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process target documents",
        variant: "destructive",
      });
      throw error;
    }
  }

  getCurrentSourceDocumentId(): number | null {
    console.log("🔍 Getting current source document ID:", this.currentSourceDocumentId);
    return this.currentSourceDocumentId;
  }

  setCurrentSourceDocumentId(id: number | null): void {
    console.log("🔧 Setting source document ID:", id);
    this.currentSourceDocumentId = id;
  }
}
