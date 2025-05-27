import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, File, FileSearch, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { fileToBase64, processImageWithGemini } from "@/services/api/geminiService";

interface DocumentUploadPanelProps {
  poFile: File | null;
  invoiceFiles: File[];
  handlePoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInvoiceFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeInvoiceFile: (index: number) => void;
  compareDocuments: () => void;
  isComparing: boolean;
}

const DOCUMENT_CLASSIFICATION_PROMPT = `You are an expert AI assistant that processes business documents. Your responsibilities include:

---

### 🎯 OBJECTIVES:

1. **Classify** the input document into one of the below predefined types and subtypes.
2. **Extract key content** into a structured **JSON format**, using the appropriate schema that fits the classified document type.

---

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

---

### 🧠 CLASSIFICATION:

Classify the document based on its layout, keywords, structure, headings, or tabular content. Identify the **domain** and **document subtype** (e.g., "Procurement & Finance - Invoice").

---

### 🧩 EXTRACTION FORMAT:

Based on your classification, extract the content into an appropriate **JSON** using **ONLY the schema relevant to the identified subtype**. Don't include irrelevant fields. Do not hallucinate missing data.

Return ONLY a valid JSON object with the classification and extracted data. Do not include any additional text or markdown formatting.`;

// Enhanced JSON parsing function
const parseGeminiResponse = (responseText: string): any => {
  console.log("=== PARSING DOCUMENT CLASSIFICATION ===");
  console.log("Raw response length:", responseText.length);
  console.log("Raw response preview:", responseText.substring(0, 300));
  
  try {
    const parsed = JSON.parse(responseText.trim());
    console.log("✅ Direct JSON parsing successful");
    console.log("Parsed object keys:", Object.keys(parsed));
    return parsed;
  } catch (error) {
    console.log("❌ Direct JSON parsing failed:", error);
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
  throw new Error(`Unable to extract valid JSON from response. Raw response: ${responseText.substring(0, 200)}...`);
};

// Global variable to store the current source document ID
let currentSourceDocumentId: number | null = null;

// Function to check if source document already exists in Supabase database with better duplicate detection
const checkSourceDocumentInDatabase = async (fileName: string): Promise<{ exists: boolean; id?: number; data?: any }> => {
  try {
    console.log("🔍 Checking if source document exists in database:", fileName);
    
    // First check by exact filename
    const { data: exactMatch, error: exactError } = await supabase
      .from('compare_source_document')
      .select('id, doc_json_extract, doc_type')
      .eq('doc_title', fileName)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (exactError) {
      console.error("❌ Error checking exact filename match:", exactError);
    }

    if (exactMatch) {
      console.log("✅ Exact filename match found:", {
        id: exactMatch.id,
        type: exactMatch.doc_type,
        hasData: !!exactMatch.doc_json_extract
      });
      return { exists: true, id: exactMatch.id, data: exactMatch.doc_json_extract };
    }

    // If no exact match, check for similar filenames (without extension)
    const baseFileName = fileName.replace(/\.[^/.]+$/, "");
    const { data: similarMatches, error: similarError } = await supabase
      .from('compare_source_document')
      .select('id, doc_title, doc_json_extract, doc_type')
      .ilike('doc_title', `${baseFileName}%`)
      .order('created_at', { ascending: false });

    if (similarError) {
      console.error("❌ Error checking similar filenames:", similarError);
    }

    if (similarMatches && similarMatches.length > 0) {
      console.log(`⚠️ Found ${similarMatches.length} similar filename(s):`, 
        similarMatches.map(m => ({ id: m.id, title: m.doc_title })));
      
      // Return the most recent similar match
      const mostRecent = similarMatches[0];
      return { exists: true, id: mostRecent.id, data: mostRecent.doc_json_extract };
    }

    console.log("❌ No source document found in database");
    return { exists: false };
  } catch (error) {
    console.error("❌ Error in checkSourceDocumentInDatabase:", error);
    return { exists: false };
  }
};

// Function to check if target documents already exist for a source document with better validation
const checkTargetDocumentsInDatabase = async (sourceDocId: number, fileNames: string[]): Promise<{ exists: boolean; existingFiles: string[]; targetData?: any }> => {
  try {
    console.log("🔍 Checking target documents for source ID:", sourceDocId, "files:", fileNames);
    const { data, error } = await supabase
      .from('compare_target_docs')
      .select('*')
      .eq('id', sourceDocId)
      .maybeSingle();

    if (error) {
      console.error("❌ Error checking target documents:", error);
      return { exists: false, existingFiles: [] };
    }

    if (!data) {
      console.log("❌ No target documents found for source ID:", sourceDocId);
      return { exists: false, existingFiles: [] };
    }

    // Check which files already exist with better matching
    const existingFiles: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const titleKey = `doc_title_${i}` as keyof typeof data;
      const title = data[titleKey] as string;
      
      if (title) {
        // Check for exact match
        if (fileNames.includes(title)) {
          existingFiles.push(title);
        } else {
          // Check for similar match (without extension)
          const baseTitle = title.replace(/\.[^/.]+$/, "");
          const matchingFile = fileNames.find(fileName => {
            const baseFileName = fileName.replace(/\.[^/.]+$/, "");
            return baseFileName === baseTitle;
          });
          if (matchingFile) {
            existingFiles.push(matchingFile);
          }
        }
      }
    }

    console.log("🔍 Target document check result:", {
      totalSlotsUsed: Object.keys(data).filter(k => k.startsWith('doc_title_') && data[k as keyof typeof data]).length,
      existingFiles: existingFiles,
      newFilesCount: fileNames.length - existingFiles.length
    });

    return { 
      exists: existingFiles.length > 0, 
      existingFiles,
      targetData: data
    };
  } catch (error) {
    console.error("❌ Error in checkTargetDocumentsInDatabase:", error);
    return { exists: false, existingFiles: [] };
  }
};

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

  const processAndStoreSourceDocument = async (file: File) => {
    try {
      console.log("=== PROCESSING SOURCE DOCUMENT ===");
      console.log("File details:", {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Check if document already exists in database with better duplicate detection
      const existsResult = await checkSourceDocumentInDatabase(file.name);
      if (existsResult.exists) {
        currentSourceDocumentId = existsResult.id!;
        console.log("✅ Source document already exists with ID:", currentSourceDocumentId);
        toast({
          title: "Document Already Processed",
          description: "This source document has already been processed. Using existing data.",
        });
        return;
      }
      
      toast({
        title: "Processing Document",
        description: "Analyzing document with AI...",
      });

      // Convert file to base64 for Gemini processing
      console.log("📄 Converting file to base64...");
      const base64Image = await fileToBase64(file);
      console.log("✅ Base64 conversion complete, length:", base64Image.length);
      
      // Process with Gemini
      console.log("🤖 Sending to Gemini API for classification...");
      const response = await processImageWithGemini(
        DOCUMENT_CLASSIFICATION_PROMPT,
        base64Image,
        file.type
      );

      console.log("📋 Gemini classification response:", {
        success: response.success,
        hasData: !!response.data,
        error: response.error
      });

      if (!response.success || !response.data) {
        console.error("❌ Gemini API failed:", response.error);
        throw new Error(response.error || "Failed to process document");
      }

      // Parse the JSON response using enhanced parsing
      let extractedData;
      try {
        console.log("🔍 Parsing document classification...");
        extractedData = parseGeminiResponse(response.data);
        
        if (!extractedData || typeof extractedData !== 'object') {
          throw new Error("Parsed data is not a valid object");
        }
        
        console.log("✅ Document classification successful:", {
          documentType: extractedData.document_type || extractedData.classification,
          hasExtractedData: Object.keys(extractedData).length > 0
        });
        
      } catch (parseError) {
        console.error("❌ Document classification parsing failed:", parseError);
        console.error("Raw response that failed to parse:", response.data);
        throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : "Invalid format"}`);
      }

      // Store in Supabase and get the ID with better error handling
      console.log("💾 Storing source document in Supabase...");
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
        console.error("❌ Supabase insert error:", error);
        throw error;
      }

      // Store the ID for linking target documents
      currentSourceDocumentId = insertedData.id;
      console.log("✅ Source document stored successfully with ID:", currentSourceDocumentId);
      
      toast({
        title: "Document Processed",
        description: `Successfully classified as: ${extractedData.document_type || extractedData.classification || "Unknown"}`,
      });

    } catch (error) {
      console.error("=== SOURCE DOCUMENT PROCESSING ERROR ===", error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process document",
        variant: "destructive",
      });
    }
  };

  const processAndStoreTargetDocuments = async (files: File[]) => {
    try {
      console.log("=== PROCESSING TARGET DOCUMENTS ===");
      console.log("Files to process:", files.length);
      
      if (files.length < 1 || files.length > 5) {
        throw new Error("Please upload between 1 and 5 target documents");
      }

      if (!currentSourceDocumentId) {
        throw new Error("Please upload and process a source document first");
      }

      // Check for duplicate target documents with enhanced logic
      const fileNames = files.map(f => f.name);
      const duplicateCheck = await checkTargetDocumentsInDatabase(currentSourceDocumentId, fileNames);
      
      if (duplicateCheck.exists && duplicateCheck.existingFiles.length > 0) {
        console.log("⚠️ Found duplicates in database:", duplicateCheck.existingFiles);
        toast({
          title: "Duplicate Documents Found",
          description: `The following documents have already been processed: ${duplicateCheck.existingFiles.join(', ')}. Skipping duplicates.`,
        });
        
        // Filter out duplicate files
        const newFiles = files.filter(f => !duplicateCheck.existingFiles.includes(f.name));
        if (newFiles.length === 0) {
          toast({
            title: "All Documents Already Processed",
            description: "All selected documents have already been processed.",
          });
          return;
        }
        
        files = newFiles;
        console.log(`📋 Processing ${files.length} new files after removing duplicates`);
      }

      toast({
        title: "Processing Target Documents",
        description: `Analyzing ${files.length} new document(s) with AI...`,
      });

      // Get existing target documents data first
      const { data: existingData, error: fetchError } = await supabase
        .from('compare_target_docs')
        .select('*')
        .eq('id', currentSourceDocumentId)
        .maybeSingle();

      if (fetchError) {
        console.error("❌ Error fetching existing target documents:", fetchError);
      }

      const processedDocs = [];

      // Process each new file with enhanced logging
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`🔄 Processing target document ${i + 1}/${files.length}: ${file.name}`);

        // Convert file to base64
        const base64Image = await fileToBase64(file);
        
        // Process with Gemini
        const response = await processImageWithGemini(
          DOCUMENT_CLASSIFICATION_PROMPT,
          base64Image,
          file.type
        );

        if (!response.success || !response.data) {
          console.error(`❌ Target document ${i + 1} processing failed:`, response.error);
          throw new Error(`Failed to process document ${i + 1}: ${response.error || "Unknown error"}`);
        }

        // Parse the response
        const extractedData = parseGeminiResponse(response.data);
        
        processedDocs.push({
          title: file.name,
          type: extractedData.document_type || extractedData.classification || "Unknown",
          json: extractedData
        });

        console.log(`✅ Target document ${i + 1} processed successfully:`, {
          title: file.name,
          type: extractedData.document_type || extractedData.classification
        });
      }

      // Prepare data for insertion/update with better slot management
      let targetDocData: any = {
        id: currentSourceDocumentId
      };

      if (existingData) {
        targetDocData = { ...existingData };
      }

      // Find the next available slot more efficiently
      let nextSlot = 1;
      if (existingData) {
        for (let i = 1; i <= 5; i++) {
          const titleKey = `doc_title_${i}` as keyof typeof existingData;
          if (!existingData[titleKey]) {
            nextSlot = i;
            break;
          }
        }
        // If all slots are filled, start from slot 1 (oldest gets replaced)
        if (nextSlot === 1) {
          for (let i = 5; i >= 1; i--) {
            const titleKey = `doc_title_${i}` as keyof typeof existingData;
            if (existingData[titleKey]) {
              nextSlot = i + 1 > 5 ? 1 : i + 1;
              break;
            }
          }
        }
      }

      // Map processed documents to the table structure with better slot allocation
      processedDocs.forEach((doc, index) => {
        const fieldIndex = nextSlot + index;
        const slotIndex = fieldIndex > 5 ? ((fieldIndex - 1) % 5) + 1 : fieldIndex;
        
        if (slotIndex <= 5) {
          targetDocData[`doc_title_${slotIndex}`] = doc.title;
          targetDocData[`doc_type_${slotIndex}`] = doc.type;
          targetDocData[`doc_json_${slotIndex}`] = doc.json;
          
          console.log(`📋 Mapped document to slot ${slotIndex}:`, {
            title: doc.title,
            type: doc.type
          });
        }
      });

      console.log("💾 Upserting target documents in Supabase...");
      console.log("Upsert data structure:", {
        id: targetDocData.id,
        slotsUsed: Object.keys(targetDocData).filter(k => k.startsWith('doc_title_') && targetDocData[k]).length
      });

      // Upsert in compare_target_docs table
      const { error } = await supabase
        .from('compare_target_docs')
        .upsert(targetDocData);

      if (error) {
        console.error("❌ Supabase target docs upsert error:", error);
        throw error;
      }

      console.log("✅ Target documents successfully processed and stored");
      toast({
        title: "Target Documents Processed",
        description: `Successfully processed ${files.length} new target document(s)`,
      });

    } catch (error) {
      console.error("=== TARGET DOCUMENTS PROCESSING ERROR ===", error);
      toast({
        title: "Target Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process target documents",
        variant: "destructive",
      });
    }
  };

  const handleSourceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("📁 New source file selected:", file.name);
      handlePoFileChange(e);
      await processAndStoreSourceDocument(file);
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
      await processAndStoreTargetDocuments(fileArray);
    }
  };

  const handleReplaceFile = () => {
    console.log("Replace button clicked");
    const input = document.getElementById('po-upload') as HTMLInputElement;
    if (input) {
      input.value = '';
      input.click();
    }
  };

  const handleAddMoreTargetFiles = () => {
    console.log("Add more target files button clicked");
    const input = document.getElementById('invoice-upload') as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Source Document Upload */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-blue-50 dark:bg-blue-950/20 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <File className="h-5 w-5" />
            Source Document
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {poFile ? (
            <div className="flex items-center justify-between p-2 border rounded-md">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="truncate max-w-[200px]">{poFile.name}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => document.getElementById('po-upload')?.click()}
              >
                Replace
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-md">
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">Upload your Source document</p>
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('po-upload')?.click()}
              >
                Primary Document
              </Button>
              <input 
                id="po-upload" 
                type="file" 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png" 
                onChange={handleSourceFileChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Target Documents Upload */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-amber-50 dark:bg-amber-950/20 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <File className="h-5 w-5" />
            Target Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {invoiceFiles.length > 0 ? (
            <div className="space-y-2">
              {invoiceFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-amber-500" />
                    <span className="truncate max-w-[200px]">{file.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeInvoiceFile(index)}>
                    Remove
                  </Button>
                </div>
              ))}
              {invoiceFiles.length < 5 && (
                <Button 
                  variant="outline" 
                  className="w-full mt-2" 
                  onClick={() => document.getElementById('invoice-upload')?.click()}
                >
                  Add More Target Documents ({invoiceFiles.length}/5)
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-md">
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">Upload 1-5 Target documents</p>
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('invoice-upload')?.click()}
              >
                Reference Documents
              </Button>
              <input 
                id="invoice-upload" 
                type="file" 
                multiple 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png" 
                onChange={handleTargetFileChange} 
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Comparison Button */}
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
