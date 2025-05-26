
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSearch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DocumentUploadPanel } from "./DocumentUploadPanel";
import { ComparisonResultsPanel } from "./ComparisonResultsPanel";
import { supabase } from "@/integrations/supabase/client";
import { processImageWithGemini } from "@/services/api/geminiService";

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

const COMPARISON_PROMPT = `You are an intelligent agent designed to compare a source document against one or more target documents. The comparison logic dynamically adjusts based on the document category and type (e.g., Invoice, PO, Claim Form, Offer Letter).

---

### 🔍 **Your Tasks:**

#### 1. Classify Documents
Identify the document type (e.g., PO, Invoice, Claim Form, etc.) and map it to the appropriate category:
* **Procurement & Finance**: PO, Invoice, Delivery Note, Payment Advice
* **Insurance & Claims**: Claim Form, Medical Bills, Accident Report
* **HR & Onboarding**: Offer Letter, Resume, Submitted Documents

#### 2. Parse and Normalize
Extract relevant fields from each document into structured JSON.

#### 3. Perform Comparison Logic
Dynamically apply business logic for comparison based on the pair of documents.

---

### 🧾 **Procurement & Finance Use Cases**

#### A. PO vs Invoices
* Match PO number, vendor name
* Compare line_items: check for quantity, rate, tax mismatches
* Calculate % deviation in unit rate or total

#### B. Invoice vs Delivery Note / GRN
* Ensure line-item quantities and items match what was actually delivered
* Highlight missing items or excess billing

#### C. Payment Advice vs Invoices
* Match invoice numbers
* Check if each invoice is fully paid, partially paid, or unpaid
* Return payment summary with status per invoice

---

### 🛡️ **Insurance & Claims Use Cases**

#### A. Claim Form vs Medical Bills
* Match treatment details, patient info, and claimed amount vs submitted bills
* Flag over-claims or missing bills

#### B. Claim Form vs Policy Terms
* Ensure coverage for the claimed condition exists
* Flag policy exclusions or claim rejection criteria

#### C. Accident Report vs Photographic Evidence
* Extract stated damage from report
* Cross-check with image metadata and description

---

### 👨‍💼 **HR & Onboarding Use Cases**

#### A. Offer Letter vs Submitted Documents
* Compare salary (CTC), date of joining, personal details
* Match submitted ID proof with offer letter information

#### B. Resume vs Background Check
* Validate past employment history, education
* Flag discrepancies in duration, company name, or degree

---

### 📊 **Output Format**
Return a JSON result for the dashboard:

{
  "comparison_summary": {
    "source_doc": "source_document_title",
    "target_docs": ["target_doc_1", "target_doc_2"],
    "category": "Procurement & Finance",
    "comparison_type": "PO vs Invoices",
    "status": "Partial Match",
    "issues_found": 2,
    "match_score": 85
  },
  "detailed_comparison": [
    {
      "field": "vendor_name",
      "source_value": "ABC Corp",
      "target_value": "ABC Corporation",
      "match": true,
      "mismatch_type": null
    }
  ]
}

---

### 🧠 Guidelines
* Use fuzzy logic for text mismatches (e.g., "ABC Corp" vs "ABC Corporation")
* Return match_score for each document pair
* If document type is not known, classify based on layout and keywords

Source Document JSON: {sourceDoc}
Target Documents JSON: {targetDocs}`;

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
        title: "Source Document Uploaded",
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
        title: "Target Document(s) Uploaded",
        description: `Successfully uploaded ${newFiles.length} target document(s)`,
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

  // Enhanced JSON parsing function
  const parseGeminiResponse = (responseText: string): any => {
    console.log("Raw Gemini response:", responseText);
    
    try {
      return JSON.parse(responseText.trim());
    } catch (error) {
      console.log("Direct JSON parsing failed, trying extraction methods...");
    }
    
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
    
    throw new Error(`Unable to extract valid JSON from response. Raw response: ${responseText.substring(0, 200)}...`);
  };

  // Compare documents using AI and database data
  const compareDocuments = async () => {
    if (!poFile || invoiceFiles.length === 0) {
      toast({
        title: "Missing Documents",
        description: "Please upload both source and at least one target document",
        variant: "destructive",
      });
      return;
    }

    setIsComparing(true);
    
    try {
      // Get the latest source document from database
      const { data: sourceDoc, error: sourceError } = await supabase
        .from('compare_source_document')
        .select('*')
        .eq('doc_title', poFile.name)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sourceError || !sourceDoc) {
        throw new Error("Source document not found in database. Please upload and process it first.");
      }

      // Get target documents from database using the source document ID
      const { data: targetDocs, error: targetError } = await supabase
        .from('compare_target_docs')
        .select('*')
        .eq('id', sourceDoc.id)
        .single();

      if (targetError || !targetDocs) {
        throw new Error("Target documents not found. Please upload and process target documents first.");
      }

      // Prepare target documents array
      const targetDocsArray = [];
      for (let i = 1; i <= 5; i++) {
        if (targetDocs[`doc_json_${i}`]) {
          targetDocsArray.push({
            title: targetDocs[`doc_title_${i}`],
            type: targetDocs[`doc_type_${i}`],
            json: targetDocs[`doc_json_${i}`]
          });
        }
      }

      if (targetDocsArray.length === 0) {
        throw new Error("No target documents found for comparison.");
      }

      // Create comparison prompt with actual data
      const comparisonPrompt = COMPARISON_PROMPT
        .replace('{sourceDoc}', JSON.stringify(sourceDoc.doc_json_extract))
        .replace('{targetDocs}', JSON.stringify(targetDocsArray));

      console.log("Sending comparison request to Gemini...");
      
      // Use Gemini to perform the comparison
      const response = await processImageWithGemini(
        comparisonPrompt,
        "", // No image needed for text comparison
        "text/plain"
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to perform comparison");
      }

      // Parse the comparison results
      const comparisonData = parseGeminiResponse(response.data);
      console.log("Comparison results:", comparisonData);

      if (comparisonData && comparisonData.comparison_summary && comparisonData.detailed_comparison) {
        // Convert detailed comparison to our format
        const mockResults: ComparisonResult[] = comparisonData.detailed_comparison.map((item: any) => ({
          field: item.field || "Unknown Field",
          poValue: item.source_value || "N/A",
          invoiceValue: item.target_value || "N/A",
          match: item.match || false
        }));

        const percentage = comparisonData.comparison_summary.match_score || 0;
        
        setComparisonResults(mockResults);
        setMatchPercentage(percentage);
        setActiveTab("results");
        
        toast({
          title: "Comparison Complete",
          description: `Documents compared with ${percentage}% match`,
        });
      } else {
        throw new Error("Invalid comparison response format");
      }

    } catch (error) {
      console.error("Comparison error:", error);
      toast({
        title: "Comparison Failed",
        description: error instanceof Error ? error.message : "Failed to compare documents",
        variant: "destructive",
      });
    } finally {
      setIsComparing(false);
    }
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
