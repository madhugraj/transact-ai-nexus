
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

const COMPARISON_PROMPT = `
You are an intelligent document comparison agent that analyzes and compares documents across the following categories and subtypes:
1. Procurement & Finance: Purchase Order (PO), Invoice, Payment Advice
2. Insurance & Claims: Claim Form, Accident Report
3. Banking & Loan Origination: Loan Application, Property Appraisal
4. Legal & Compliance: Contract, Company Filings
5. HR & Onboarding: Job Description, Resume
6. Healthcare: Prescription, Treatment Summary
7. Trade & Export/Import: Letter of Credit, Customs Declarations
8. Education & Certification: Student Application, Certificates

Your task is to perform context-aware comparisons and deliver JSON results.

### 🔍 **Core Functions:**

#### 1. Document Classification & Context Understanding
- Detect document types and subtypes from content/metadata.
- Identify business context (e.g., HR recruitment, procurement compliance).
- Adapt comparison logic per category/subtype.

**Example (HR & Onboarding)**:
- **Input**:
  - Source: "JD-2025-003.pdf" (Role: Compliance Analyst, Skills: Python, SQL, Experience: 3-5 years, Qualifications: Bachelor’s in Finance).
  - Target: "RES-2025-002.pdf" (Name: Alice Brown, Skills: Python, Java, Experience: 4 years, Qualifications: Bachelor’s in Economics).
- **Classification**:
  - Source: Job Description, Context: Recruitment, Logic: Compare skills, experience, qualifications.
  - Target: Resume, Context: Candidate evaluation, Logic: Match JD requirements.

**Example (Procurement & Finance)**:
- **Input**:
  - Source: "PO-2025-001.pdf" (Vendor: RegTech Solutions, Total: $54,000).
  - Target: "INV-2025-789.pdf" (Vendor: RegTech Solution, Total: $54,400).
- **Classification**:
  - Source: PO, Context: Procurement compliance, Logic: Compare vendor, totals with 5% tolerance.
  - Target: Invoice, Context: Payment verification, Logic: Match PO reference.

#### 2. Multi-Target Comparison Logic
- Compare 1 source against multiple targets.
- Generate individual and consolidated scores.
- Highlight patterns and anomalies.

**Example (HR)**:
- **Input**:
  - Source: "JD-2025-003.pdf".
  - Targets: ["RES-2025-002.pdf", "PO-2025-001.pdf"].
- **Output**:
  - Scores: RES-2025-002: 74% (skill mismatch); PO-2025-001: 10% (irrelevant).
  - Analysis: Pattern: Resume aligns with JD skills; Anomaly: PO is unrelated.

#### 3. Dynamic Field Analysis
- Extract/compare fields per document type.
- Apply business rules from the table below.
- Calculate weighted match scores.

**Business Rules Table**:
| Category                  | Subtype            | Key Fields                         | Rules                                      | Weights (Field1/Field2/Field3/Field4) |
|---------------------------|--------------------|------------------------------------|--------------------------------------------|---------------------------------------|
| Procurement & Finance     | PO, Invoice        | Vendor, Total, Line Items          | Fuzzy match vendor (90%), 5% total tolerance | 20%/40%/40%/-                     |
|                           | Payment Advice     | Amount, Invoice Reference          | Exact amount match                        | 20%/40%/40%/-                     |
| Insurance & Claims        | Claim Form         | Claimant, Amount                   | Fuzzy match name, 10% amount tolerance     | 30%/40%/30%/-                     |
|                           | Accident Report    | Injured, Date                      | Fuzzy match name, exact date              | 30%/40%/30%/-                     |
| Banking & Loan Origination| Loan Application   | Applicant, Loan Amount             | Exact name, 10% amount tolerance          | 30%/40%/30%/-                     |
|                           | Property Appraisal | Property, Value                    | Exact address, 15% value tolerance        | 30%/40%/30%/-                     |
| Legal & Compliance        | Contract           | Parties, Terms                     | Fuzzy match parties, exact terms          | 30%/40%/30%/-                     |
|                           | Company Filings    | Company, Filing Date               | Fuzzy match company, exact date           | 30%/40%/30%/-                     |
| HR & Onboarding           | Job Description    | Skills, Experience, Qualifications | 80% skill overlap, ±1 year experience     | 40%/30%/30%/-                     |
|                           | Resume             | Skills, Experience, Qualifications | 80% skill overlap, ±1 year experience     | 40%/30%/30%/-                     |
| Healthcare                | Prescription       | Patient, Medication, Dosage        | Exact patient/dosage                      | 30%/40%/30%/-                     |
|                           | Treatment Summary  | Patient, Diagnosis                 | Exact patient, fuzzy match diagnosis      | 30%/40%/30%/-                     |
| Trade & Export/Import     | Letter of Credit   | Beneficiary, Amount                | Fuzzy match name, 5% amount tolerance     | 30%/40%/30%/-                     |
|                           | Customs Declarations | Exporter, Goods                  | Fuzzy match exporter, exact goods         | 30%/40%/30%/-                     |
| Education & Certification | Student Application| Applicant, Program                 | Exact name, fuzzy match program           | 30%/40%/30%/-                     |
|                           | Certificates       | Recipient, Course                  | Exact name, fuzzy match course            | 30%/40%/30%/-                     |

**Example (HR - JD vs. CV)**:
- **Input**:
  - JD: Role: Compliance Analyst, Skills: Python, SQL, Experience: 3-5 years, Qualifications: Bachelor’s in Finance.
  - CV: Name: Alice Brown, Skills: Python, Java, Experience: 4 years, Qualifications: Bachelor’s in Economics.
- **Analysis**:
  - Skills: 50% overlap (Python matches, Java vs. SQL), match = false.
  - Experience: 4 years within 3-5 years, match = true.
  - Qualifications: Economics vs. Finance, 80% similarity, match = false.
- **Score**: Skills (40%): 50% → 20/40; Experience (30%): 100% → 30/30; Qualifications (30%): 80% → 24/30 = 74%.

### 📊 **Expected Output Format:**

A structured JSON object summarizing the comparison, detailing field results, optional line items, and target-specific outcomes. Monetary values are in USD, dates in ISO format (YYYY-MM-DD), scores in percentages (0-100).

```json
{
  "summary": {
    "source": { "title": "string", "type": "string", "category": "string" }, // Source details
    "targets": [{ "title": "string", "type": "string", "category": "string" }], // Target details
    "comparison_type": "string", // e.g., "JD vs CV"
    "status": "string", // e.g., "Partial Match"
    "issues_count": integer, // Number of discrepancies
    "match_score": number // Weighted score (0-100)
  },
  "targets": [ // Per-target results
    {
      "index": integer,
      "title": "string",
      "score": number, // 0-100
      "issues": ["string"], // e.g., "Skill mismatch"
      "fields": [ // Field comparisons
        {
          "field": "string", // e.g., "skills"
          "source_value": any,
          "target_value": any,
          "match": boolean,
          "mismatch_type": "string" | null, // e.g., "skill_mismatch"
          "weight": number, // 0-1
          "score": number // 0-100
        }
      ],
      "line_items": [ // Optional, for POs/Invoices
        {
          "id": "string",
          "name": "string",
          "source_quantity": number | null,
          "target_quantity": number | null,
          "source_price": number | null,
          "target_price": number | null,
          "quantity_match": boolean,
          "price_match": boolean
        }
      ]
    }
  ]
}
### Example Output:

{
  "summary": {
    "source": { "title": "JD-2025-003.pdf", "type": "Job Description", "category": "HR & Onboarding" },
    "targets": [
      { "title": "RES-2025-002.pdf", "type": "Resume", "category": "HR & Onboarding" },
      { "title": "PO-2025-001.pdf", "type": "Purchase Order", "category": "Procurement & Finance" }
    ],
    "comparison_type": "JD vs Multiple",
    "status": "Partial Match",
    "issues_count": 3,
    "match_score": 74
  },
  "targets": [
    {
      "index": 0,
      "title": "RES-2025-002.pdf",
      "score": 74,
      "issues": ["Skill mismatch (Java vs. SQL)", "Qualification mismatch"],
      "fields": [
        {
          "field": "skills",
          "source_value": ["Python", "SQL"],
          "target_value": ["Python", "Java"],
          "match": false,
          "mismatch_type": "skill_mismatch",
          "weight": 0.4,
          "score": 50
        },
        {
          "field": "experience",
          "source_value": "3-5 years",
          "target_value": "4 years",
          "match": true,
          "mismatch_type": null,
          "weight": 0.3,
          "score": 100
        },
        {
          "field": "qualifications",
          "source_value": "Bachelor’s in Finance",
          "target_value": "Bachelor’s in Economics",
          "match": false,
          "mismatch_type": "qualification_mismatch",
          "weight": 0.3,
          "score": 80
        }
      ],
      "line_items": []
    },
    {
      "index": 1,
      "title": "PO-2025-001.pdf",
      "score": 10,
      "issues": ["Irrelevant category"],
      "fields": [
        {
          "field": "vendor_name",
          "source_value": null,
          "target_value": "RegTech Solutions",
          "match": false,
          "mismatch_type": "irrelevant_field",
          "weight": 0.2,
          "score": 0
        }
      ],
      "line_items": [
        {
          "id": "1",
          "name": "Compliance Software",
          "source_quantity": null,
          "target_quantity": 1,
          "source_price": null,
          "target_price": 50000.00,
          "quantity_match": false,
          "price_match": false
        }
      ]
    }
  ]
}
🧠 Analysis Guidelines:

Fuzzy matching for text fields (90% threshold).
Numerical tolerances: 5% for financial amounts, 10% for loans, 15% for appraisals.
Exact matches for critical fields (e.g., prescription dosages).
Industry standards: Sarbanes-Oxley (Procurement), HIPAA (Healthcare), EEOC (HR).
Meaningful issue descriptions (e.g., “Skill mismatch in CV”).
Weighted scores per Business Rules Table.
Source Document: {sourceDoc}
Target Documents: {targetDocs}

Perform a comprehensive comparison and return detailed JSON results.
''\'`;

const COMPARISON_PROMPT_old = `You are an intelligent document comparison agent that analyzes and compares documents across multiple categories. Your task is to perform detailed, context-aware comparisons and provide comprehensive analysis.

### 🔍 **Core Functions:**

#### 1. Document Classification & Context Understanding
- Automatically detect document types: PO, Invoice, Delivery Note, Claim Form, Resume, Offer Letter, etc.
- Identify the business context and comparison scenario
- Adapt comparison logic based on document pairs

#### 2. Multi-Target Comparison Logic
- Compare 1 source document against multiple target documents
- Generate individual comparison scores for each target
- Provide consolidated analysis across all targets
- Highlight patterns and anomalies across the document set

#### 3. Dynamic Field Analysis
- Extract and compare relevant fields based on document type
- Apply business rules specific to the document category
- Generate detailed field-by-field comparison results
- Calculate match scores using weighted importance

### 📊 **Expected Output Format:**

{
  "comparison_summary": {
    "source_doc": "source_document_title",
    "target_docs": ["target_doc_1", "target_doc_2", "target_doc_3"],
    "category": "Procurement & Finance",
    "comparison_type": "PO vs Invoices",
    "status": "Partial Match",
    "issues_found": 3,
    "match_score": 78
  },
  "detailed_comparison": [
    {
      "field": "vendor_name",
      "source_value": "ABC Corp",
      "target_value": "ABC Corporation",
      "match": true,
      "mismatch_type": null
    },
    {
      "field": "total_amount",
      "source_value": 1500.00,
      "target_value": 1600.00,
      "match": false,
      "mismatch_type": "amount_variance"
    }
  ],
  "line_items": [
    {
      "id": "1",
      "itemName": "Office Supplies",
      "sourceQuantity": 10,
      "targetQuantity": 10,
      "sourceUnitPrice": 15.00,
      "targetUnitPrice": 16.00,
      "sourceTotal": 150.00,
      "targetTotal": 160.00,
      "quantityMatch": true,
      "priceMatch": false,
      "totalMatch": false,
      "targetIndex": 0
    }
  ],
  "target_specific_results": [
    {
      "target_index": 0,
      "target_title": "Invoice_001.pdf",
      "match_score": 85,
      "issues": ["Price variance on item 2"],
      "detailed_comparison": [
        {
          "field": "invoice_number",
          "source_value": "PO-2024-001",
          "target_value": "INV-2024-001",
          "match": false
        }
      ]
    }
  ]
}

### 🧠 **Analysis Guidelines:**
- Use fuzzy matching for text fields (vendor names, addresses)
- Apply tolerance levels for numerical comparisons
- Consider industry-standard variance thresholds
- Provide meaningful issue descriptions
- Calculate weighted match scores based on field importance

**Source Document:** {sourceDoc}
**Target Documents:** {targetDocs}

Perform a comprehensive comparison and return detailed JSON results.`;



const DocumentComparison = () => {
  const { toast } = useToast();
  const [poFile, setPoFile] = useState<File | null>(null);
  const [invoiceFiles, setInvoiceFiles] = useState<File[]>([]);
  const [activeInvoiceIndex, setActiveInvoiceIndex] = useState<number>(-1);
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
      setActiveInvoiceIndex(-1);
    }
  };

  // Enhanced JSON parsing function with better error handling
  const parseGeminiResponse = (responseText: string): any => {
    console.log("Raw Gemini response:", responseText);
    
    try {
      const parsed = JSON.parse(responseText.trim());
      console.log("Successfully parsed JSON directly");
      return parsed;
    } catch (error) {
      console.log("Direct JSON parsing failed, trying extraction methods...");
    }
    
    // Try to extract from code blocks
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
    
    // Try to find JSON object in the text
    const jsonStartIndex = responseText.indexOf('{');
    const jsonEndIndex = responseText.lastIndexOf('}');
    
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
      try {
        const extractedJson = responseText.substring(jsonStartIndex, jsonEndIndex + 1);
        const parsed = JSON.parse(extractedJson);
        console.log("Successfully extracted JSON using substring method");
        return parsed;
      } catch (error) {
        console.error("Failed to parse extracted JSON using substring:", error);
      }
    }
    
    console.error("All parsing methods failed");
    throw new Error(`Unable to extract valid JSON from response. Raw response: ${responseText.substring(0, 200)}...`);
  };

  // Enhanced comparison function with better error handling and duplicate checking
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
      
      // Check for existing source document
      console.log("Checking for existing source document...");
      const { data: existingSource, error: sourceCheckError } = await supabase
        .from('compare_source_document')
        .select('*')
        .eq('doc_title', poFile.name)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log("Source document check:", { existingSource, sourceCheckError });

      if (!existingSource) {
        console.log("Source document not found in database");
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
        .eq('id', existingSource.id)
        .maybeSingle();

      console.log("Target documents check:", { existingTargets, targetCheckError });

      if (!existingTargets) {
        console.log("Target documents not found in database");
        toast({
          title: "Processing Required", 
          description: "Target documents need to be processed first. Please upload and process them in the table extraction tab.",
          variant: "destructive",
        });
        return;
      }

      // Prepare target documents array with validation
      console.log("Preparing target documents array...");
      const targetDocsArray = [];
      for (let i = 1; i <= 5; i++) {
        if (existingTargets[`doc_json_${i}`] && existingTargets[`doc_title_${i}`]) {
          const targetDoc = {
            index: i - 1,
            title: existingTargets[`doc_title_${i}`],
            type: existingTargets[`doc_type_${i}`] || 'Unknown',
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
        console.error("No valid target documents found");
        throw new Error("No target documents found for comparison.");
      }

      console.log("Total target documents prepared:", targetDocsArray.length);

      // Create enhanced comparison prompt
      const comparisonPrompt = COMPARISON_PROMPT
        .replace('{sourceDoc}', JSON.stringify(existingSource.doc_json_extract))
        .replace('{targetDocs}', JSON.stringify(targetDocsArray));

      console.log("Sending comparison request to Gemini API...");
      
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
        // Convert detailed comparison to our format
        const uiResults: ComparisonResult[] = comparisonData.detailed_comparison.map((item: any) => ({
          field: item.field || "Unknown Field",
          poValue: item.source_value || "N/A",
          invoiceValue: item.target_value || "N/A", 
          sourceValue: item.source_value || "N/A",
          targetValue: item.target_value || "N/A",
          match: item.match || false
        }));

        const percentage = Math.round(comparisonData.comparison_summary.match_score || 0);
        
        // Create enhanced detailed results object
        const detailedComparisonResult: DetailedComparisonResult = {
          overallMatch: percentage,
          headerResults: uiResults,
          lineItems: comparisonData.line_items || [],
          sourceDocument: existingSource,
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
            doc_id_compare: existingSource.id,
            doc_type_source: existingSource.doc_type,
            doc_type_target: targetDocsArray.map(doc => doc.type).join(', '),
            doc_compare_count_targets: targetDocsArray.length,
            doc_compare_results: {
              comparison_summary: comparisonData.comparison_summary,
              detailed_comparison: comparisonData.detailed_comparison,
              line_items: comparisonData.line_items || [],
              target_specific_results: comparisonData.target_specific_results || [],
              match_percentage: percentage,
              processed_at: new Date().toISOString(),
              source_document: existingSource,
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
            sourceDoc: existingSource,
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
          {comparisonResults.length > 0 && detailedResults ? (
            <>
              <ComparisonResultsPanel
                poFile={poFile}
                invoiceFiles={invoiceFiles}
                activeInvoiceIndex={activeInvoiceIndex}
                setActiveInvoiceIndex={setActiveInvoiceIndex}
                comparisonResults={comparisonResults}
                matchPercentage={matchPercentage}
                detailedResults={detailedResults}
              />
              
              {/* Integrated Dashboard Section */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Comparison Analytics Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <ComparisonDashboard />
                </CardContent>
              </Card>
            </>
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
