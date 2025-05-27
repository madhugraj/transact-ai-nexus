
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ComparisonResult, DetailedComparisonResult } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { COMPARISON_PROMPT } from '../constants/comparisonPrompt';

export const useDocumentComparison = () => {
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
        .replace('{sourceDoc}', JSON.stringify(existingSource.doc_json_extract, null, 2))
        .replace('{targetDocs}', JSON.stringify(targetDocsArray, null, 2));

      console.log("Sending comparison request to Gemini API...");
      console.log("Prompt length:", comparisonPrompt.length);
      
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
            maxOutputTokens: 8192,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Gemini API error:", errorData);
        throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
      }

      const responseData = await response.json();
      console.log("Full Gemini API response:", responseData);
      
      if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content) {
        console.error("Invalid response structure:", responseData);
        throw new Error("Invalid response structure from Gemini API");
      }
      
      const responseText = responseData.candidates[0].content.parts[0].text;
      console.log("Enhanced Gemini response received, length:", responseText.length);
      console.log("Response preview:", responseText.substring(0, 500));
      
      // Parse the enhanced comparison results
      const comparisonData = parseGeminiResponse(responseText);
      console.log("Parsed enhanced comparison data:", comparisonData);

      if (comparisonData && comparisonData.summary && comparisonData.targets) {
        // Convert to our format using the new structure
        const uiResults: ComparisonResult[] = [];
        
        // Process each target's field comparisons
        comparisonData.targets.forEach((target: any, targetIndex: number) => {
          if (target.fields && Array.isArray(target.fields)) {
            target.fields.forEach((field: any) => {
              uiResults.push({
                field: `${field.field} (Target ${targetIndex + 1})`,
                poValue: field.source_value || "N/A",
                invoiceValue: field.target_value || "N/A",
                sourceValue: field.source_value || "N/A",
                targetValue: field.target_value || "N/A",
                match: field.match || false
              });
            });
          }
        });

        const percentage = Math.round(comparisonData.summary.match_score || 0);
        
        // Create enhanced detailed results object
        const detailedComparisonResult: DetailedComparisonResult = {
          overallMatch: percentage,
          headerResults: uiResults,
          lineItems: [],
          sourceDocument: existingSource,
          targetDocuments: targetDocsArray,
          comparisonSummary: {
            ...comparisonData.summary,
            targets: comparisonData.targets || []
          }
        };

        // Process line items if available
        comparisonData.targets.forEach((target: any) => {
          if (target.line_items && Array.isArray(target.line_items)) {
            detailedComparisonResult.lineItems.push(...target.line_items);
          }
        });
        
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
              summary: comparisonData.summary,
              targets: comparisonData.targets,
              match_percentage: percentage,
              processed_at: new Date().toISOString(),
              source_document: existingSource,
              target_documents: targetDocsArray,
              raw_response: responseText.substring(0, 2000)
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

  return {
    poFile,
    setPoFile,
    invoiceFiles,
    setInvoiceFiles,
    activeInvoiceIndex,
    setActiveInvoiceIndex,
    isComparing,
    comparisonResults,
    detailedResults,
    matchPercentage,
    activeTab,
    setActiveTab,
    handlePoFileChange,
    handleInvoiceFileChange,
    removeInvoiceFile,
    compareDocuments
  };
};
