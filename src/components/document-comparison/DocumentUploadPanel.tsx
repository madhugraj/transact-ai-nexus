
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

6. **Healthcare**
   - Prescription
   - Treatment Summary

7. **Trade & Export/Import**
   - Letter of Credit
   - Customs Declarations

8. **Education & Certification**
   - Student Application
   - Exam Score Report

---

### 🧠 CLASSIFICATION:

Classify the document based on its layout, keywords, structure, headings, or tabular content. Identify the **domain** and **document subtype** (e.g., "Procurement & Finance - Invoice").

---

### 🧩 EXTRACTION FORMAT:

Based on your classification, extract the content into an appropriate **JSON** using **ONLY the schema relevant to the identified subtype**. Don't include irrelevant fields. Do not hallucinate missing data.

Return ONLY a valid JSON object with the classification and extracted data. Do not include any additional text or markdown formatting.`;

// Enhanced JSON parsing function
const parseGeminiResponse = (responseText: string): any => {
  console.log("Raw Gemini response:", responseText);
  
  // Strategy 1: Try to parse as direct JSON
  try {
    return JSON.parse(responseText.trim());
  } catch (error) {
    console.log("Direct JSON parsing failed, trying extraction methods...");
  }
  
  // Strategy 2: Extract JSON from markdown code blocks
  const codeBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i;
  const codeBlockMatch = responseText.match(codeBlockRegex);
  
  if (codeBlockMatch) {
    try {
      const extractedJson = JSON.parse(codeBlockMatch[1].trim());
      console.log("Successfully extracted JSON from code block");
      return extractedJson;
    } catch (error) {
      console.error("Failed to parse JSON from code block:", error);
    }
  }
  
  // Strategy 3: Find JSON object in the text (look for { to })
  const jsonRegex = /\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/;
  const jsonMatch = responseText.match(jsonRegex);
  
  if (jsonMatch) {
    try {
      const extractedJson = JSON.parse(jsonMatch[0]);
      console.log("Successfully extracted JSON using regex");
      return extractedJson;
    } catch (error) {
      console.error("Failed to parse extracted JSON:", error);
    }
  }
  
  // Strategy 4: Try to clean and parse common formatting issues
  let cleanedText = responseText
    .replace(/^[^{]*/, '') // Remove text before first {
    .replace(/[^}]*$/, '') // Remove text after last }
    .replace(/,\s*}/g, '}') // Remove trailing commas
    .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
  
  if (cleanedText.startsWith('{') && cleanedText.endsWith('}')) {
    try {
      const cleanedJson = JSON.parse(cleanedText);
      console.log("Successfully parsed cleaned JSON");
      return cleanedJson;
    } catch (error) {
      console.error("Failed to parse cleaned JSON:", error);
    }
  }
  
  throw new Error(`Unable to extract valid JSON from response. Raw response: ${responseText.substring(0, 200)}...`);
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
      console.log("Starting document processing for:", file.name, "Size:", file.size, "Type:", file.type);
      
      toast({
        title: "Processing Document",
        description: "Analyzing document with AI...",
      });

      // Convert file to base64 for Gemini processing
      console.log("Converting file to base64...");
      const base64Image = await fileToBase64(file);
      console.log("Base64 conversion complete, length:", base64Image.length);
      
      // Process with Gemini
      console.log("Sending to Gemini API...");
      const response = await processImageWithGemini(
        DOCUMENT_CLASSIFICATION_PROMPT,
        base64Image,
        file.type
      );

      console.log("Gemini API response:", response);

      if (!response.success || !response.data) {
        console.error("Gemini API failed:", response.error);
        throw new Error(response.error || "Failed to process document");
      }

      // Parse the JSON response using enhanced parsing
      let extractedData;
      try {
        console.log("Attempting to parse Gemini response...");
        extractedData = parseGeminiResponse(response.data);
        
        // Validate that we have the basic structure we expect
        if (!extractedData || typeof extractedData !== 'object') {
          throw new Error("Parsed data is not a valid object");
        }
        
        console.log("Successfully parsed document data:", extractedData);
        
      } catch (parseError) {
        console.error("Enhanced parsing failed:", parseError);
        console.error("Raw response that failed to parse:", response.data);
        throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : "Invalid format"}`);
      }

      // Store in Supabase
      console.log("Storing in Supabase...");
      const { error } = await supabase
        .from('compare_source_document')
        .insert({
          doc_title: file.name,
          doc_type: extractedData.document_type || extractedData.classification || "Unknown",
          doc_json_extract: extractedData
        });

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      console.log("Document successfully processed and stored");
      toast({
        title: "Document Processed",
        description: `Successfully classified as: ${extractedData.document_type || extractedData.classification || "Unknown"}`,
      });

    } catch (error) {
      console.error("Error processing source document:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process document",
        variant: "destructive",
      });
    }
  };

  const handleSourceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("New source file selected:", file.name);
      // Call the original handler first
      handlePoFileChange(e);
      
      // Then process and store the document
      await processAndStoreSourceDocument(file);
    }
  };

  const handleReplaceFile = () => {
    console.log("Replace button clicked");
    const input = document.getElementById('po-upload') as HTMLInputElement;
    if (input) {
      input.value = ''; // Clear the input to allow selecting the same file again
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
                onClick={handleReplaceFile}
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
              <Button 
                variant="outline" 
                className="w-full mt-2" 
                onClick={() => document.getElementById('invoice-upload')?.click()}
              >
                Add More Target Documents
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-md">
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">Upload one or more Target documents</p>
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
                onChange={handleInvoiceFileChange} 
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
