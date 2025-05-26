
// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { FileSearch } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import { DocumentUploadPanel } from "./DocumentUploadPanel";
// import { ComparisonResultsPanel } from "./ComparisonResultsPanel";
// import { supabase } from "@/integrations/supabase/client";


// // Types for document comparison
// interface DocumentDetails {
//   vendor?: string;
//   amount?: number;
//   quantity?: string;
//   date?: string;
//   documentNumber?: string;
// }

// export interface ComparisonResult {
//   field: string;
//   poValue: string | number;
//   invoiceValue: string | number;
//   match: boolean;
// }

// const COMPARISON_PROMPT = `You are an intelligent agent designed to compare a source document against one or more target documents. The comparison logic dynamically adjusts based on the document category and type (e.g., Invoice, PO, Claim Form, Offer Letter).

// ---

// ### 🔍 **Your Tasks:**

// #### 1. Classify Documents
// Identify the document type (e.g., PO, Invoice, Delivery Note, Payment Advice)
// * **Procurement & Finance**: PO, Invoice, Delivery Note, Payment Advice
// * **Insurance & Claims**: Claim Form, Medical Bills, Accident Report
// * **HR & Onboarding**: Offer Letter, Resume, Submitted Documents

// #### 2. Parse and Normalize
// Extract relevant fields from each document into structured JSON.

// #### 3. Perform Comparison Logic
// Dynamically apply business logic for comparison based on the pair of documents.

// ---

// ### 🧾 **Procurement & Finance Use Cases**

// #### A. PO vs Invoices
// * Match PO number, vendor name
// * Compare line_items: check for quantity, rate, tax mismatches
// * Calculate % deviation in unit rate or total

// #### B. Invoice vs Delivery Note / GRN
// * Ensure line-item quantities and items match what was actually delivered
// * Highlight missing items or excess billing

// #### C. Payment Advice vs Invoices
// * Match invoice numbers
// * Check if each invoice is fully paid, partially paid, or unpaid
// * Return payment summary with status per invoice

// ---

// ### 🛡️ **Insurance & Claims Use Cases**

// #### A. Claim Form vs Medical Bills
// * Match treatment details, patient info, and claimed amount vs submitted bills
// * Flag over-claims or missing bills

// #### B. Claim Form vs Policy Terms
// * Ensure coverage for the claimed condition exists
// * Flag policy exclusions or claim rejection criteria

// #### C. Accident Report vs Photographic Evidence
// * Extract stated damage from report
// * Cross-check with image metadata and description

// ---

// ### 👨‍💼 **HR & Onboarding Use Cases**

// #### A. Offer Letter vs Submitted Documents
// * Compare salary (CTC), date of joining, personal details
// * Match submitted ID proof with offer letter information

// #### B. JD vs Resume
// * Validate JD with resume on qulaification, experience, skillset, others
// * Flag discrepancies in qulalification, or degree 

// ---

// ### 📊 **Output Format**
// Return a JSON result for the dashboard:

// {
//   "comparison_summary": {
//     "source_doc": "source_document_title",
//     "target_docs": ["target_doc_1", "target_doc_2"],
//     "category": "Procurement & Finance",
//     "comparison_type": "PO vs Invoices",
//     "status": "Partial Match",
//     "issues_found": 2,
//     "match_score": 85
//   },
//   "detailed_comparison": [
//     {
//       "field": "vendor_name",
//       "source_value": "ABC Corp",
//       "target_value": "ABC Corporation",
//       "match": true,
//       "mismatch_type": null
//     }
//   ]
// }

// ---

// ### 🧠 Guidelines
// * Use fuzzy logic for text mismatches (e.g., "ABC Corp" vs "ABC Corporation")
// * Return match_score for each document pair
// * If document type is not known, classify based on layout and keywords

// Source Document JSON: {sourceDoc}
// Target Documents JSON: {targetDocs}`;

// const DocumentComparison = () => {
//   const { toast } = useToast();
//   const [poFile, setPoFile] = useState<File | null>(null);
//   const [invoiceFiles, setInvoiceFiles] = useState<File[]>([]);
//   const [activeInvoiceIndex, setActiveInvoiceIndex] = useState<number>(0);
//   const [isComparing, setIsComparing] = useState(false);
//   const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
//   const [matchPercentage, setMatchPercentage] = useState<number>(0);
//   const [activeTab, setActiveTab] = useState("upload");

//   // Handle PO file selection
//   const handlePoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       setPoFile(e.target.files[0]);
//       toast({
//         title: "Source Document Uploaded",
//         description: `Successfully uploaded ${e.target.files[0].name}`,
//       });
//     }
//   };

//   // Handle Invoice file selection
//   const handleInvoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files.length > 0) {
//       const newFiles = Array.from(e.target.files);
//       setInvoiceFiles(prev => [...prev, ...newFiles]);
//       toast({
//         title: "Target Document(s) Uploaded",
//         description: `Successfully uploaded ${newFiles.length} target document(s)`,
//       });
//     }
//   };

//   // Remove invoice file
//   const removeInvoiceFile = (index: number) => {
//     setInvoiceFiles(invoiceFiles.filter((_, i) => i !== index));
//     if (activeInvoiceIndex === index) {
//       setActiveInvoiceIndex(0);
//     }
//   };

//   // Enhanced JSON parsing function
//   const parseGeminiResponse = (responseText: string): any => {
//     console.log("Raw Gemini response:", responseText);
    
//     try {
//       return JSON.parse(responseText.trim());
//     } catch (error) {
//       console.log("Direct JSON parsing failed, trying extraction methods...");
//     }
    
//     const codeBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i;
//     const codeBlockMatch = responseText.match(codeBlockRegex);
    
//     if (codeBlockMatch) {
//       try {
//         const extractedJson = JSON.parse(codeBlockMatch[1].trim());
//         console.log("Successfully extracted JSON from code block");
//         return extractedJson;
//       } catch (error) {
//         console.error("Failed to parse JSON from code block:", error);
//       }
//     }
    
//     const jsonRegex = /\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/;
//     const jsonMatch = responseText.match(jsonRegex);
    
//     if (jsonMatch) {
//       try {
//         const extractedJson = JSON.parse(jsonMatch[0]);
//         console.log("Successfully extracted JSON using regex");
//         return extractedJson;
//       } catch (error) {
//         console.error("Failed to parse extracted JSON:", error);
//       }
//     }
    
//     throw new Error(`Unable to extract valid JSON from response. Raw response: ${responseText.substring(0, 200)}...`);
//   };

//   // Compare documents using AI and database data (TEXT-ONLY)
//   const compareDocuments = async () => {
//     console.log("=== STARTING DOCUMENT COMPARISON ===");
    
//     if (!poFile || invoiceFiles.length === 0) {
//       console.error("Missing files - PO file:", !!poFile, "Invoice files:", invoiceFiles.length);
//       toast({
//         title: "Missing Documents",
//         description: "Please upload both source and at least one target document",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsComparing(true);
    
//     try {
//       console.log("Starting comparison process...");
//       console.log("Source file:", poFile.name);
//       console.log("Target files:", invoiceFiles.map(f => f.name));
      
//       // Get the latest source document from database
//       console.log("Fetching source document from database...");
//       const { data: sourceDoc, error: sourceError } = await supabase
//         .from('compare_source_document')
//         .select('*')
//         .eq('doc_title', poFile.name)
//         .order('created_at', { ascending: false })
//         .limit(1)
//         .maybeSingle();

//       console.log("Source document query result:", { sourceDoc, sourceError });

//       if (sourceError || !sourceDoc) {
//         console.error("Source document error:", sourceError);
//         throw new Error("Source document not found in database. Please upload and process it first.");
//       }

//       console.log("Found source document:", {
//         id: sourceDoc.id,
//         title: sourceDoc.doc_title,
//         type: sourceDoc.doc_type,
//         hasJsonData: !!sourceDoc.doc_json_extract
//       });

//       // Get target documents from database using the source document ID
//       console.log("Fetching target documents for source ID:", sourceDoc.id);
//       const { data: targetDocs, error: targetError } = await supabase
//         .from('compare_target_docs')
//         .select('*')
//         .eq('id', sourceDoc.id)
//         .maybeSingle();

//       console.log("Target documents query result:", { targetDocs, targetError });

//       if (targetError || !targetDocs) {
//         console.error("Target documents error:", targetError);
//         throw new Error("Target documents not found. Please upload and process target documents first.");
//       }

//       // Prepare target documents array
//       console.log("Preparing target documents array...");
//       const targetDocsArray = [];
//       for (let i = 1; i <= 5; i++) {
//         if (targetDocs[`doc_json_${i}`]) {
//           const targetDoc = {
//             title: targetDocs[`doc_title_${i}`],
//             type: targetDocs[`doc_type_${i}`],
//             json: targetDocs[`doc_json_${i}`]
//           };
//           targetDocsArray.push(targetDoc);
//           console.log(`Target document ${i}:`, {
//             title: targetDoc.title,
//             type: targetDoc.type,
//             hasJsonData: !!targetDoc.json
//           });
//         }
//       }

//       if (targetDocsArray.length === 0) {
//         console.error("No target documents found for comparison");
//         throw new Error("No target documents found for comparison.");
//       }

//       console.log("Total target documents prepared:", targetDocsArray.length);

//       // Create comparison prompt with actual data
//       const comparisonPrompt = COMPARISON_PROMPT
//         .replace('{sourceDoc}', JSON.stringify(sourceDoc.doc_json_extract))
//         .replace('{targetDocs}', JSON.stringify(targetDocsArray));

//       console.log("Comparison prompt prepared, length:", comparisonPrompt.length);
//       console.log("Sending comparison request to Gemini API...");
      
//       // Use Gemini to perform the comparison - TEXT ONLY, NO IMAGES
//       const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'x-goog-api-key': localStorage.getItem('Gemini_key') || 'AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk'
//         },
//         body: JSON.stringify({
//           contents: [{
//             parts: [{
//               text: comparisonPrompt
//             }]
//           }],
//           generationConfig: {
//             temperature: 0.1,
//             topK: 32,
//             topP: 1,
//             maxOutputTokens: 2048,
//           }
//         })
//       });

//       console.log("Gemini API response status:", response.status);

//       if (!response.ok) {
//         const errorData = await response.text();
//         console.error("Gemini API error details:", {
//           status: response.status,
//           statusText: response.statusText,
//           errorData: errorData
//         });
//         throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
//       }

//       const responseData = await response.json();
//       console.log("Gemini API response data:", responseData);

//       if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content) {
//         console.error("Invalid Gemini response structure:", responseData);
//         throw new Error("Invalid response structure from Gemini API");
//       }

//       const responseText = responseData.candidates[0].content.parts[0].text;
//       console.log("Raw Gemini response text:", responseText);
      
//       // Parse the comparison results
//       console.log("Parsing comparison results...");
//       const comparisonData = parseGeminiResponse(responseText);
//       console.log("Parsed comparison data:", comparisonData);

//       if (comparisonData && comparisonData.comparison_summary && comparisonData.detailed_comparison) {
//         // Convert detailed comparison to our format
//         const uiResults: ComparisonResult[] = comparisonData.detailed_comparison.map((item: any) => ({
//           field: item.field || "Unknown Field",
//           poValue: item.source_value || "N/A",
//           invoiceValue: item.target_value || "N/A",
//           match: item.match || false
//         }));

//         const percentage = comparisonData.comparison_summary.match_score || 0;
        
//         console.log("Formatted comparison results:", {
//           resultsCount: uiResults.length,
//           matchPercentage: percentage,
//           summary: comparisonData.comparison_summary
//         });

//         // Store results in Supabase doc_compare_results table
//         console.log("Storing comparison results in database...");
//         const { data: insertedResult, error: insertError } = await supabase
//           .from('Doc_Compare_results')
//           .insert({
//             doc_id_compare: sourceDoc.id,
//             doc_type_source: sourceDoc.doc_type,
//             doc_type_target: targetDocsArray.map(doc => doc.type).join(', '),
//             doc_compare_count_targets: targetDocsArray.length,
//             doc_compare_results: {
//               comparison_summary: comparisonData.comparison_summary,
//               detailed_comparison: comparisonData.detailed_comparison,
//               match_percentage: percentage,
//               processed_at: new Date().toISOString()
//             }
//           })
//           .select()
//           .single();

//         if (insertError) {
//           console.error("Error storing comparison results:", insertError);
//           toast({
//             title: "Warning",
//             description: "Comparison successful but failed to save results to database",
//             variant: "destructive",
//           });
//         } else {
//           console.log("Successfully stored comparison results:", insertedResult);
//         }
        
//         // Update UI state to show results
//         console.log("Setting UI state with results...");
//         setComparisonResults(uiResults);
//         setMatchPercentage(percentage);
//         setActiveTab("results");
        
//         console.log("=== COMPARISON COMPLETED SUCCESSFULLY ===");
//         console.log("Final results set in state:", {
//           resultsCount: uiResults.length,
//           matchPercentage: percentage
//         });
        
//         toast({
//           title: "Comparison Complete",
//           description: `Documents compared with ${percentage}% match`,
//         });

//         // Dispatch custom event to notify dashboard to refresh
//         window.dispatchEvent(new CustomEvent('comparisonComplete', {
//           detail: {
//             sourceDoc: sourceDoc,
//             targetDocs: targetDocsArray,
//             results: comparisonData,
//             matchPercentage: percentage
//           }
//         }));
        
//       } else {
//         console.error("Invalid comparison response format:", comparisonData);
//         throw new Error("Invalid comparison response format");
//       }

//     } catch (error) {
//       console.error("=== COMPARISON ERROR ===");
//       console.error("Error details:", {
//         message: error instanceof Error ? error.message : String(error),
//         stack: error instanceof Error ? error.stack : undefined,
//         timestamp: new Date().toISOString()
//       });
//       toast({
//         title: "Comparison Failed",
//         description: error instanceof Error ? error.message : "Failed to compare documents",
//         variant: "destructive",
//       });
//     } finally {
//       setIsComparing(false);
//       console.log("=== COMPARISON PROCESS ENDED ===");
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//         <TabsList className="grid grid-cols-2 w-full max-w-md">
//           <TabsTrigger value="upload">Upload Documents</TabsTrigger>
//           <TabsTrigger value="results" disabled={comparisonResults.length === 0}>
//             Comparison Results
//           </TabsTrigger>
//         </TabsList>
        
//         <TabsContent value="upload" className="mt-4 space-y-4">
//           <DocumentUploadPanel 
//             poFile={poFile}
//             invoiceFiles={invoiceFiles}
//             handlePoFileChange={handlePoFileChange}
//             handleInvoiceFileChange={handleInvoiceFileChange}
//             removeInvoiceFile={removeInvoiceFile}
//             compareDocuments={compareDocuments}
//             isComparing={isComparing}
//           />
//         </TabsContent>
        
//         <TabsContent value="results" className="mt-4 space-y-4">
//           {comparisonResults.length > 0 ? (
//             <ComparisonResultsPanel
//               poFile={poFile}
//               invoiceFiles={invoiceFiles}
//               activeInvoiceIndex={activeInvoiceIndex}
//               setActiveInvoiceIndex={setActiveInvoiceIndex}
//               comparisonResults={comparisonResults}
//               matchPercentage={matchPercentage}
//             />
//           ) : (
//             <div className="text-center py-8 text-muted-foreground">
//               No comparison results available. Please run a comparison first.
//             </div>
//           )}
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// };

// export default DocumentComparison;







import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { DocumentUploadPanel } from "./DocumentUploadPanel";
import { ComparisonResultsPanel, LineItemComparison } from "./ComparisonResultsPanel";
import { supabase } from "@/integrations/supabase/client";

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
  const [lineItems, setLineItems] = useState<LineItemComparison[]>([]);
  const [comparisonType, setComparisonType] = useState<string | undefined>();
  const [category, setCategory] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState("upload");

  const parseGeminiResponse = (responseText: string): any => {
    try {
      return JSON.parse(responseText.trim());
    } catch {
      const block = responseText.match(/```(?:json)?\s*({[\s\S]*?})\s*```/i);
      if (block) {
        try {
          return JSON.parse(block[1].trim());
        } catch {}
      }
      const fallback = responseText.match(/\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/);
      if (fallback) {
        try {
          return JSON.parse(fallback[0]);
        } catch {}
      }
    }
    throw new Error("Failed to extract valid JSON from Gemini response.");
  };

  const compareDocuments = async () => {
    if (!poFile || invoiceFiles.length === 0) {
      toast({
        title: "Missing Documents",
        description: "Please upload both source and at least one target document",
        variant: "destructive"
      });
      return;
    }

    setIsComparing(true);
    try {
      const { data: sourceDoc } = await supabase
        .from('compare_source_document')
        .select('*')
        .eq('doc_title', poFile.name)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: targetDocs } = await supabase
        .from('compare_target_docs')
        .select('*')
        .eq('id', sourceDoc.id)
        .maybeSingle();

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

      // const COMPARISON_PROMPT = `...`; // your full prompt remains unchanged

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
* Validate JD with resume on qulaification, experience, skillset, others
* Flag discrepancies in qulalification, or degree 

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
      const prompt = COMPARISON_PROMPT
        .replace("{sourceDoc}", JSON.stringify(sourceDoc.doc_json_extract))
        .replace("{targetDocs}", JSON.stringify(targetDocsArray));

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': localStorage.getItem('Gemini_key') || ''
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048
          }
        })
      });

      const result = await response.json();
      const responseText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = parseGeminiResponse(responseText);

      const summary = parsed.comparison_summary || {};
      const details = parsed.detailed_comparison || [];
      const items = Array.isArray(parsed.line_items_comparison) ? parsed.line_items_comparison : [];

      const mappedResults: ComparisonResult[] = details.map((item: any) => ({
        field: item.field || "Unknown Field",
        poValue: item.source_value || "N/A",
        invoiceValue: item.target_value || "N/A",
        match: item.match ?? false
      }));

      const mappedLineItems: LineItemComparison[] = items.map((item: any, idx: number) => ({
        id: item.id || `${idx + 1}`,
        itemName: item.item_name || "Unnamed",
        poQuantity: item.po_quantity || 0,
        invoiceQuantity: item.invoice_quantity || 0,
        poUnitPrice: item.po_unit_price || 0,
        invoiceUnitPrice: item.invoice_unit_price || 0,
        poTotal: item.po_total || 0,
        invoiceTotal: item.invoice_total || 0,
        quantityMatch: item.quantity_match ?? false,
        priceMatch: item.price_match ?? false,
        totalMatch: item.total_match ?? false
      }));

      setComparisonResults(mappedResults);
      setLineItems(mappedLineItems);
      setMatchPercentage(summary.match_score || 0);
      setComparisonType(summary.comparison_type);
      setCategory(summary.category);
      setActiveTab("results");

      toast({
        title: "Comparison Complete",
        description: `${summary.comparison_type || 'Documents'} matched ${summary.match_score || 0}%`
      });

      window.dispatchEvent(new CustomEvent('comparisonComplete', {
        detail: {
          summary,
          results: mappedResults,
          matchPercentage: summary.match_score,
        }
      }));

    } catch (error) {
      toast({
        title: "Comparison Failed",
        description: (error as Error).message,
        variant: "destructive"
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
            handlePoFileChange={(e) => {
              if (e.target.files?.[0]) setPoFile(e.target.files[0]);
            }}
            handleInvoiceFileChange={(e) => {
              if (e.target.files?.length) setInvoiceFiles(prev => [...prev, ...Array.from(e.target.files)]);
            }}
            removeInvoiceFile={(index) => {
              setInvoiceFiles(files => files.filter((_, i) => i !== index));
              if (activeInvoiceIndex === index) setActiveInvoiceIndex(0);
            }}
            compareDocuments={compareDocuments}
            isComparing={isComparing}
          />
        </TabsContent>

        <TabsContent value="results" className="mt-4 space-y-4">
          {comparisonResults.length > 0 ? (
            <ComparisonResultsPanel
              poFile={poFile}
              invoiceFiles={invoiceFiles}
              activeInvoiceIndex={activeInvoiceIndex}
              setActiveInvoiceIndex={setActiveInvoiceIndex}
              comparisonResults={comparisonResults}
              matchPercentage={matchPercentage}
              lineItems={lineItems}
              comparisonType={comparisonType}
              category={category}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No comparison results available. Please run a comparison first.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentComparison;
