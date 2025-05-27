import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { DocumentUploadPanel } from "./DocumentUploadPanel";
import { ComparisonResultsPanel } from "./ComparisonResultsPanel";
import ComparisonDashboard from "./ComparisonDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

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
  sourceValue?: string | number;
  targetValue?: string | number;
}

export interface DetailedComparisonResult {
  overallMatch: number;
  headerResults: ComparisonResult[];
  lineItems: any[];
  sourceDocument: any;
  targetDocuments: any[];
  comparisonSummary: any;
}

const COMPARISON_PROMPT = `You are an intelligent agent designed to compare a source document against one or more target documents. The comparison logic dynamically adjusts based on the document category and type (e.g., Invoice, PO, Claim Form, Offer Letter).

---

### 🔍 **Your Tasks:**

#### 1. Classify Documents
Identify the document type (e.g., PO, Invoice, Delivery Note, Payment Advice)
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

#### B. JD vs Resume
* Validate JD with resume on qualification, experience, skillset, others
* Flag discrepancies in qualification, or degree 

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
  ],
  "line_items": [
    {
      "id": "1",
      "itemName": "Item Name",
      "poQuantity": 2,
      "invoiceQuantity": 2,
      "poUnitPrice": 100.00,
      "invoiceUnitPrice": 100.00,
      "poTotal": 200.00,
      "invoiceTotal": 200.00,
      "quantityMatch": true,
      "priceMatch": true,
      "totalMatch": true,
      "targetIndex": 0
    }
  ],
  "target_specific_results": [
    {
      "target_index": 0,
      "target_title": "Invoice_1.pdf",
      "match_score": 85,
      "issues": ["Price mismatch on item 2"],
      "line_items": [...]
    }
  ]
}

---

### 🧠 Guidelines
* Use fuzzy logic for text mismatches (e.g., "ABC Corp" vs "ABC Corporation")
* Return match_score for each document pair and overall
* Provide target_specific_results for individual document analysis
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
  const [detailedResults, setDetailedResults] = useState<DetailedComparisonResult | null>(null);
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

  // Compare documents using AI and database data (TEXT-ONLY)
  const compareDocuments = async () => {
    console.log("=== STARTING ENHANCED DOCUMENT COMPARISON ===");
    
    if (!poFile || invoiceFiles.length === 0) {
      console.error("Missing files - PO file:", !!poFile, "Invoice files:", invoiceFiles.length);
      toast({
        title: "Missing Documents",
        description: "Please upload both source and at least one target document",
        variant: "destructive",
      });
      return;
    }

    setIsComparing(true);
    
    try {
      console.log("Starting enhanced comparison process...");
      console.log("Source file:", poFile.name);
      console.log("Target files:", invoiceFiles.map(f => f.name));
      
      // Check for existing source document to avoid duplicates
      console.log("Checking for existing source document...");
      const { data: existingSource, error: sourceCheckError } = await supabase
        .from('compare_source_document')
        .select('*')
        .eq('doc_title', poFile.name)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log("Existing source check result:", { existingSource, sourceCheckError });

      let sourceDoc = existingSource;
      
      if (!sourceDoc) {
        console.log("Source document not found, need to process it first");
        toast({
          title: "Processing Required",
          description: "Source document needs to be processed first. Please upload and process it in the table extraction tab.",
          variant: "destructive",
        });
        return;
      }

      // Check for existing target documents
      console.log("Checking for existing target documents...");
      const { data: existingTargets, error: targetCheckError } = await supabase
        .from('compare_target_docs')
        .select('*')
        .eq('id', sourceDoc.id)
        .maybeSingle();

      console.log("Target documents query result:", { existingTargets, targetCheckError });

      if (targetCheckError || !existingTargets) {
        console.log("Target documents not found, need to process them first");
        toast({
          title: "Processing Required", 
          description: "Target documents need to be processed first. Please upload and process them in the table extraction tab.",
          variant: "destructive",
        });
        return;
      }

      // Prepare target documents array with ALL target documents
      console.log("Preparing target documents array for enhanced comparison...");
      const targetDocsArray = [];
      for (let i = 1; i <= 5; i++) {
        if (existingTargets[`doc_json_${i}`]) {
          const targetDoc = {
            index: i - 1,
            title: existingTargets[`doc_title_${i}`],
            type: existingTargets[`doc_type_${i}`],
            json: existingTargets[`doc_json_${i}`]
          };
          targetDocsArray.push(targetDoc);
          console.log(`Target document ${i}:`, {
            title: targetDoc.title,
            type: targetDoc.type,
            hasJsonData: !!targetDoc.json
          });
        }
      }

      if (targetDocsArray.length === 0) {
        console.error("No target documents found for enhanced comparison");
        throw new Error("No target documents found for comparison.");
      }

      console.log("Total target documents prepared for enhanced comparison:", targetDocsArray.length);

      // Create enhanced comparison prompt with actual data
      const comparisonPrompt = COMPARISON_PROMPT
        .replace('{sourceDoc}', JSON.stringify(sourceDoc.doc_json_extract))
        .replace('{targetDocs}', JSON.stringify(targetDocsArray));

      console.log("Enhanced comparison prompt prepared, sending to Gemini API...");
      
      // Use Gemini for enhanced comparison
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': localStorage.getItem('Gemini_key') || 'AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: comparisonPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Gemini API error:", errorData);
        throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
      }

      const responseData = await response.json();
      const responseText = responseData.candidates[0].content.parts[0].text;
      console.log("Enhanced Gemini response received");
      
      // Parse the enhanced comparison results
      const comparisonData = parseGeminiResponse(responseText);
      console.log("Parsed enhanced comparison data:", comparisonData);

      if (comparisonData && comparisonData.comparison_summary && comparisonData.detailed_comparison) {
        // Convert detailed comparison to our format with enhanced support
        const uiResults: ComparisonResult[] = comparisonData.detailed_comparison.map((item: any) => ({
          field: item.field || "Unknown Field",
          poValue: item.source_value || "N/A",
          invoiceValue: item.target_value || "N/A", 
          sourceValue: item.source_value || "N/A",
          targetValue: item.target_value || "N/A",
          match: item.match || false
        }));

        const percentage = comparisonData.comparison_summary.match_score || 0;
        
        // Create enhanced detailed results object
        const detailedComparisonResult: DetailedComparisonResult = {
          overallMatch: percentage,
          headerResults: uiResults,
          lineItems: comparisonData.line_items || [],
          sourceDocument: sourceDoc,
          targetDocuments: targetDocsArray,
          comparisonSummary: {
            ...comparisonData.comparison_summary,
            target_specific_results: comparisonData.target_specific_results || []
          }
        };
        
        console.log("Enhanced comparison results formatted:", {
          resultsCount: uiResults.length,
          matchPercentage: percentage,
          targetDocuments: targetDocsArray.length,
          lineItemsCount: detailedComparisonResult.lineItems.length
        });

        // Store enhanced results in database
        console.log("Storing enhanced comparison results in database...");
        const { error: insertError } = await supabase
          .from('Doc_Compare_results')
          .insert({
            doc_id_compare: sourceDoc.id,
            doc_type_source: sourceDoc.doc_type,
            doc_type_target: targetDocsArray.map(doc => doc.type).join(', '),
            doc_compare_count_targets: targetDocsArray.length,
            doc_compare_results: {
              comparison_summary: comparisonData.comparison_summary,
              detailed_comparison: comparisonData.detailed_comparison,
              line_items: comparisonData.line_items || [],
              target_specific_results: comparisonData.target_specific_results || [],
              match_percentage: percentage,
              processed_at: new Date().toISOString(),
              source_document: sourceDoc,
              target_documents: targetDocsArray
            }
          });

        if (insertError) {
          console.error("Error storing enhanced comparison results:", insertError);
        } else {
          console.log("Successfully stored enhanced comparison results");
        }
        
        // Update UI state with enhanced results
        setComparisonResults(uiResults);
        setDetailedResults(detailedComparisonResult);
        setMatchPercentage(percentage);
        setActiveTab("results");
        
        console.log("=== ENHANCED COMPARISON COMPLETED SUCCESSFULLY ===");
        
        toast({
          title: "Comparison Complete",
          description: `Documents compared with ${percentage}% overall match across ${targetDocsArray.length} targets`,
        });

        // Dispatch enhanced event for dashboard refresh
        window.dispatchEvent(new CustomEvent('comparisonComplete', {
          detail: {
            sourceDoc: sourceDoc,
            targetDocs: targetDocsArray,
            results: comparisonData,
            matchPercentage: percentage
          }
        }));
        
      } else {
        console.error("Invalid enhanced comparison response format:", comparisonData);
        throw new Error("Invalid comparison response format");
      }

    } catch (error) {
      console.error("=== ENHANCED COMPARISON ERROR ===", error);
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
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          <TabsTrigger value="results" disabled={comparisonResults.length === 0}>
            Comparison Results
          </TabsTrigger>
          <TabsTrigger value="dashboard">
            Analysis Dashboard
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
          {comparisonResults.length > 0 && detailedResults ? (
            <ComparisonResultsPanel
              poFile={poFile}
              invoiceFiles={invoiceFiles}
              activeInvoiceIndex={activeInvoiceIndex}
              setActiveInvoiceIndex={setActiveInvoiceIndex}
              comparisonResults={comparisonResults}
              matchPercentage={matchPercentage}
              detailedResults={detailedResults}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No comparison results available. Please run a comparison first.
            </div>
          )}
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparison Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <ComparisonDashboard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentComparison;
