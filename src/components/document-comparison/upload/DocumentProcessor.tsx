import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { fileToBase64, processImageWithGemini } from "@/services/api/geminiService";

const DOCUMENT_CLASSIFICATION_PROMPT = `You are an expert AI assistant that processes business documents. Your responsibilities include:

### 🎯 OBJECTIVES:
1. **Classify** the input document into one of the below predefined types and subtypes.
2. **Extract key content** into a structured **JSON format**, using the appropriate schema that fits the classified document type.

### 📚 DOCUMENT TYPES & SUBTYPES:
1. **Procurement & Finance**
   - Purchase Order (PO)
   - Invoice
   - Payment Advice

2. **Insurance & Claims**
   - Claim Form
   - Accident Report

3. **Banking & Loan Origination**
   - Loan Application
   - Property Appraisal

4. **Legal & Compliance**
   - Contract
   - Company Filings

5. **HR & Onboarding**
   - Offer Letter
   - Resume
   - Job Description

6. **Healthcare**
   - Prescription
   - Treatment Summary

7. **Trade & Export/Import**
   - Letter of Credit
   - Customs Declarations

8. **Education & Certification**
   - Student Application
   - Certificates

Return ONLY a valid JSON object with the classification and extracted data. Do not include any additional text or markdown formatting.`;

const parseGeminiResponse = (responseText: string): any => {
  console.log("🔍 Parsing document classification response...");
  
  try {
    const parsed = JSON.parse(responseText.trim());
    console.log("✅ Direct JSON parsing successful");
    return parsed;
  } catch (error) {
    console.log("❌ Direct JSON parsing failed, trying code block extraction...");
  }
  
  const codeBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i;
  const codeBlockMatch = responseText.match(codeBlockRegex);
  
  if (codeBlockMatch) {
    try {
      const extractedJson = JSON.parse(codeBlockMatch[1].trim());
      console.log("✅ Successfully extracted JSON from code block");
      return extractedJson;
    } catch (error) {
      console.error("❌ Failed to parse JSON from code block:", error);
    }
  }
  
  const jsonRegex = /\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/;
  const jsonMatch = responseText.match(jsonRegex);
  
  if (jsonMatch) {
    try {
      const extractedJson = JSON.parse(jsonMatch[0]);
      console.log("✅ Successfully extracted JSON using regex");
      return extractedJson;
    } catch (error) {
      console.error("❌ Failed to parse extracted JSON:", error);
    }
  }
  
  console.error("❌ All parsing methods failed");
  throw new Error(`Unable to extract valid JSON from response`);
};

export class DocumentProcessor {
  private toast: any;
  private currentSourceDocumentId: number | null = null;

  constructor(toast: any) {
    this.toast = toast;
    console.log("🔧 DocumentProcessor initialized");
  }

  async checkSourceDocumentInDatabase(fileName: string): Promise<{ exists: boolean; id?: number; data?: any }> {
    try {
      console.log("🔍 Checking if source document exists:", fileName);
      
      const { data: exactMatch, error } = await supabase
        .from('compare_source_document')
        .select('id, doc_json_extract, doc_type')
        .eq('doc_title', fileName)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("❌ Error checking source document:", error);
        return { exists: false };
      }

      if (exactMatch) {
        console.log("✅ Source document found:", exactMatch.id);
        return { exists: true, id: exactMatch.id, data: exactMatch.doc_json_extract };
      }

      return { exists: false };
    } catch (error) {
      console.error("❌ Error in checkSourceDocumentInDatabase:", error);
      return { exists: false };
    }
  }

  async checkTargetDocumentsInDatabase(sourceDocId: number, fileNames: string[]): Promise<{ exists: boolean; existingFiles: string[]; targetData?: any }> {
    try {
      console.log("🔍 Checking target documents for source ID:", sourceDocId);
      console.log("🔍 Looking for files:", fileNames);
      
      const { data, error } = await supabase
        .from('compare_target_docs')
        .select('*')
        .eq('id', sourceDocId)
        .maybeSingle();

      if (error || !data) {
        console.log("❌ No target documents found");
        return { exists: false, existingFiles: [] };
      }

      const existingFiles: string[] = [];
      for (let i = 1; i <= 5; i++) {
        const titleKey = `doc_title_${i}` as keyof typeof data;
        const title = data[titleKey] as string;
        
        if (title && fileNames.includes(title)) {
          existingFiles.push(title);
          console.log(`✅ Found existing file in slot ${i}:`, title);
        }
      }

      console.log("📋 Existing files found:", existingFiles);
      return { 
        exists: existingFiles.length > 0, 
        existingFiles,
        targetData: data
      };
    } catch (error) {
      console.error("❌ Error checking target documents:", error);
      return { exists: false, existingFiles: [] };
    }
  }

  async clearStaleTargetDocuments(sourceDocId: number): Promise<void> {
    try {
      console.log("🧹 Clearing stale target documents for source ID:", sourceDocId);
      
      const { error } = await supabase
        .from('compare_target_docs')
        .delete()
        .eq('id', sourceDocId);

      if (error) {
        console.error("❌ Error clearing stale target documents:", error);
      } else {
        console.log("✅ Stale target documents cleared");
      }
    } catch (error) {
      console.error("❌ Error in clearStaleTargetDocuments:", error);
    }
  }

  async processSourceDocument(file: File): Promise<void> {
    try {
      console.log("=== PROCESSING SOURCE DOCUMENT ===");
      console.log("📁 File:", file.name, "Size:", file.size, "Type:", file.type);
      
      const existsResult = await this.checkSourceDocumentInDatabase(file.name);
      if (existsResult.exists) {
        this.currentSourceDocumentId = existsResult.id!;
        console.log("✅ Source document already exists with ID:", this.currentSourceDocumentId);
        
        // Clear any stale target documents for this source to prevent confusion
        await this.clearStaleTargetDocuments(this.currentSourceDocumentId);
        
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

      const base64Image = await fileToBase64(file);
      console.log("📄 File converted to base64, length:", base64Image.length);
      
      const response = await processImageWithGemini(
        DOCUMENT_CLASSIFICATION_PROMPT,
        base64Image,
        file.type
      );

      if (!response.success || !response.data) {
        console.error("❌ Gemini processing failed:", response.error);
        throw new Error(response.error || "Failed to process document");
      }

      console.log("✅ Gemini response received, parsing...");
      const extractedData = parseGeminiResponse(response.data);
      console.log("✅ Data extracted:", extractedData);
      
      const { data: insertedData, error } = await supabase
        .from('compare_source_document')
        .insert({
          doc_title: file.name,
          doc_type: extractedData.document_type || extractedData.classification || "Unknown",
          doc_json_extract: extractedData
        })
        .select('id')
        .single();

      if (error) {
        console.error("❌ Database insert error:", error);
        throw error;
      }

      this.currentSourceDocumentId = insertedData.id;
      console.log("✅ Source document stored with ID:", this.currentSourceDocumentId);
      
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
      
      // First clear any existing target documents for this source to prevent stale data
      await this.clearStaleTargetDocuments(this.currentSourceDocumentId);
      console.log("🧹 Cleared any existing target documents for fresh start");
      
      this.toast({
        title: "Processing Target Documents",
        description: `Analyzing ${files.length} document(s)...`,
      });

      const processedDocs = [];

      for (const [index, file] of files.entries()) {
        console.log(`📄 Processing file ${index + 1}/${files.length}:`, file.name);
        
        const base64Image = await fileToBase64(file);
        const response = await processImageWithGemini(
          DOCUMENT_CLASSIFICATION_PROMPT,
          base64Image,
          file.type
        );

        if (!response.success || !response.data) {
          const errorMsg = `Failed to process ${file.name}`;
          console.error("❌", errorMsg, response.error);
          throw new Error(errorMsg);
        }

        const extractedData = parseGeminiResponse(response.data);
        console.log(`✅ File ${index + 1} processed:`, file.name);
        
        processedDocs.push({
          title: file.name,
          type: extractedData.document_type || extractedData.classification || "Unknown",
          json: extractedData
        });
      }

      let targetDocData: any = {
        id: this.currentSourceDocumentId
      };

      console.log("📝 Storing documents starting from slot 1 (fresh start)");

      processedDocs.forEach((doc, index) => {
        const slotIndex = index + 1;
        if (slotIndex <= 5) {
          targetDocData[`doc_title_${slotIndex}`] = doc.title;
          targetDocData[`doc_type_${slotIndex}`] = doc.type;
          targetDocData[`doc_json_${slotIndex}`] = doc.json;
          console.log(`📊 Assigned slot ${slotIndex} to:`, doc.title);
        }
      });

      const { error } = await supabase
        .from('compare_target_docs')
        .upsert(targetDocData);

      if (error) {
        console.error("❌ Database upsert error:", error);
        throw error;
      }

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
