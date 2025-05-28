
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
      console.log("Source file selected:", e.target.files[0].name);
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
      
      // Check for duplicates in current selection
      const existingNames = invoiceFiles.map(f => f.name);
      const duplicateFiles = newFiles.filter(f => existingNames.includes(f.name));
      
      if (duplicateFiles.length > 0) {
        console.warn("Duplicate files detected:", duplicateFiles.map(f => f.name));
        toast({
          title: "Duplicate Files Detected",
          description: `${duplicateFiles.length} duplicate file(s) were skipped: ${duplicateFiles.map(f => f.name).join(', ')}`,
          variant: "destructive",
        });
      }
      
      // Only add non-duplicate files
      const uniqueFiles = newFiles.filter(f => !existingNames.includes(f.name));
      
      if (uniqueFiles.length > 0) {
        setInvoiceFiles(prev => [...prev, ...uniqueFiles]);
        console.log("Target files added:", uniqueFiles.map(f => f.name));
        toast({
          title: "Target Document(s) Uploaded",
          description: `Successfully uploaded ${uniqueFiles.length} unique target document(s)`,
        });
      }
    }
  };

  // Remove invoice file
  const removeInvoiceFile = (index: number) => {
    const removedFile = invoiceFiles[index];
    console.log("Removing target file:", removedFile?.name);
    setInvoiceFiles(invoiceFiles.filter((_, i) => i !== index));
    if (activeInvoiceIndex === index) {
      setActiveInvoiceIndex(-1);
    }
  };

  // Check for existing comparison in database
  const checkExistingComparison = async (sourceDocId: number, targetDocTitles: string[]) => {
    console.log("🔍 Checking for existing comparison...");
    console.log("Source Doc ID:", sourceDocId);
    console.log("Target Doc Titles:", targetDocTitles);
    
    try {
      // Sort target titles for consistent comparison
      const sortedTargetTitles = [...targetDocTitles].sort().join(', ');
      
      const { data: existingComparison, error } = await supabase
        .from('Doc_Compare_results')
        .select('*')
        .eq('doc_id_compare', sourceDocId)
        .eq('doc_type_target', sortedTargetTitles)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error checking existing comparison:", error);
        return null;
      }

      if (existingComparison) {
        console.log("✅ Found existing comparison:", existingComparison.id);
        return existingComparison;
      } else {
        console.log("❌ No existing comparison found");
        return null;
      }
    } catch (error) {
      console.error("Exception while checking existing comparison:", error);
      return null;
    }
  };

  // Enhanced JSON parsing function with better error handling
  const parseGeminiResponse = (responseText: string): any => {
    console.log("=== PARSING GEMINI RESPONSE ===");
    console.log("Raw response length:", responseText.length);
    console.log("Raw response preview:", responseText.substring(0, 1000));
    
    try {
      const parsed = JSON.parse(responseText.trim());
      console.log("✅ Successfully parsed JSON directly");
      console.log("Parsed object structure:", {
        hasSummary: !!parsed.summary,
        hasTargets: !!parsed.targets,
        targetsCount: parsed.targets?.length || 0
      });
      return parsed;
    } catch (error) {
      console.log("❌ Direct JSON parsing failed:", error);
    }
    
    // Try to extract from code blocks
    const codeBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i;
    const codeBlockMatch = responseText.match(codeBlockRegex);
    
    if (codeBlockMatch) {
      try {
        const extractedJson = JSON.parse(codeBlockMatch[1].trim());
        console.log("✅ Successfully extracted JSON from code block");
        console.log("Extracted object structure:", {
          hasSummary: !!extractedJson.summary,
          hasTargets: !!extractedJson.targets
        });
        return extractedJson;
      } catch (error) {
        console.error("❌ Failed to parse JSON from code block:", error);
      }
    }
    
    // Try to find JSON object in the text
    const jsonStartIndex = responseText.indexOf('{');
    const jsonEndIndex = responseText.lastIndexOf('}');
    
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
      try {
        const extractedJson = responseText.substring(jsonStartIndex, jsonEndIndex + 1);
        const parsed = JSON.parse(extractedJson);
        console.log("✅ Successfully extracted JSON using substring method");
        return parsed;
      } catch (error) {
        console.error("❌ Failed to parse extracted JSON using substring:", error);
      }
    }
    
    console.error("❌ All parsing methods failed");
    console.error("Full response for debugging:", responseText);
    throw new Error(`Unable to extract valid JSON from response. Response length: ${responseText.length}`);
  };

  // Enhanced comparison function with better error handling and duplicate checking
  const compareDocuments = async () => {
    console.log("=== STARTING DOCUMENT COMPARISON ===");
    
    if (!poFile || invoiceFiles.length === 0) {
      console.error("❌ Missing files - PO file:", !!poFile, "Invoice files:", invoiceFiles.length);
      toast({
        title: "Missing Documents",
        description: "Please upload both source and at least one target document",
        variant: "destructive",
      });
      return;
    }

    setIsComparing(true);
    
    try {
      console.log("📋 Starting comparison process...");
      console.log("Source file:", poFile.name);
      console.log("Target files:", invoiceFiles.map(f => f.name));
      
      // Check for existing source document
      console.log("🔍 Checking for existing source document...");
      const { data: existingSource, error: sourceCheckError } = await supabase
        .from('compare_source_document')
        .select('*')
        .eq('doc_title', poFile.name)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sourceCheckError) {
        console.error("❌ Error checking source document:", sourceCheckError);
        throw new Error(`Source document check failed: ${sourceCheckError.message}`);
      }

      if (!existingSource) {
        console.log("❌ Source document not found in database");
        toast({
          title: "Processing Required",
          description: "Source document needs to be processed first. Please upload and process it in the table extraction tab.",
          variant: "destructive",
        });
        return;
      }

      console.log("✅ Source document found:", {
        id: existingSource.id,
        title: existingSource.doc_title,
        type: existingSource.doc_type,
        hasJsonData: !!existingSource.doc_json_extract
      });

      // Check for existing target documents
      console.log("🔍 Checking for existing target documents...");
      const { data: existingTargets, error: targetCheckError } = await supabase
        .from('compare_target_docs')
        .select('*')
        .eq('id', existingSource.id)
        .maybeSingle();

      if (targetCheckError) {
        console.error("❌ Error checking target documents:", targetCheckError);
        throw new Error(`Target documents check failed: ${targetCheckError.message}`);
      }

      if (!existingTargets) {
        console.log("❌ Target documents not found in database");
        toast({
          title: "Processing Required", 
          description: "Target documents need to be processed first. Please upload and process them in the table extraction tab.",
          variant: "destructive",
        });
        return;
      }

      // Prepare target documents array with better validation
      console.log("📋 Preparing target documents array...");
      const targetDocsArray = [];
      const targetTitles = [];
      
      for (let i = 1; i <= 5; i++) {
        const titleKey = `doc_title_${i}` as keyof typeof existingTargets;
        const typeKey = `doc_type_${i}` as keyof typeof existingTargets;
        const jsonKey = `doc_json_${i}` as keyof typeof existingTargets;
        
        if (existingTargets[titleKey] && existingTargets[jsonKey]) {
          const targetDoc = {
            index: i - 1,
            title: existingTargets[titleKey] as string,
            type: (existingTargets[typeKey] as string) || 'Unknown',
            json: existingTargets[jsonKey]
          };
          targetDocsArray.push(targetDoc);
          targetTitles.push(targetDoc.title);
          console.log(`✅ Target document ${i} prepared:`, {
            title: targetDoc.title,
            type: targetDoc.type,
            hasJsonData: !!targetDoc.json
          });
        }
      }

      if (targetDocsArray.length === 0) {
        console.error("❌ No valid target documents found");
        throw new Error("No target documents found for comparison.");
      }

      console.log(`📋 Total target documents prepared: ${targetDocsArray.length}`);

      // Check for existing comparison results
      const existingComparison = await checkExistingComparison(existingSource.id, targetTitles);
      
      if (existingComparison && existingComparison.doc_compare_results) {
        console.log("🔄 Using existing comparison results from database");
        
        const storedResults = existingComparison.doc_compare_results;
        console.log("Stored results structure:", {
          hasSummary: !!storedResults.summary,
          hasTargets: !!storedResults.targets,
          matchPercentage: storedResults.match_percentage
        });
        
        // Process existing results
        if (storedResults.summary && storedResults.targets) {
          const uiResults: ComparisonResult[] = [];
          
          storedResults.targets.forEach((target: any, targetIndex: number) => {
            console.log(`Processing stored target ${targetIndex + 1}:`, {
              title: target.title,
              score: target.score,
              fieldsCount: target.fields?.length || 0
            });
            
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

          const percentage = Math.round(storedResults.match_percentage || storedResults.summary?.match_score || 0);
          
          const detailedComparisonResult: DetailedComparisonResult = {
            overallMatch: percentage,
            headerResults: uiResults,
            lineItems: [],
            sourceDocument: existingSource,
            targetDocuments: targetDocsArray,
            comparisonSummary: {
              ...storedResults.summary,
              target_specific_results: storedResults.targets || []
            }
          };

          // Process line items
          storedResults.targets.forEach((target: any, targetIndex: number) => {
            if (target.line_items && Array.isArray(target.line_items)) {
              target.line_items.forEach((item: any) => {
                detailedComparisonResult.lineItems.push({
                  ...item,
                  targetIndex: targetIndex
                });
              });
            }
          });
          
          setComparisonResults(uiResults);
          setDetailedResults(detailedComparisonResult);
          setMatchPercentage(percentage);
          setActiveTab("results");
          
          console.log("✅ Successfully loaded existing comparison results");
          toast({
            title: "Existing Comparison Loaded",
            description: `Previously computed comparison with ${percentage}% match loaded from database`,
          });
          
          return;
        }
      }

      // Create enhanced comparison prompt
      console.log("📝 Creating comparison prompt for new comparison...");
      const sourceDocString = JSON.stringify(existingSource.doc_json_extract, null, 2);
      const targetDocsString = JSON.stringify(targetDocsArray, null, 2);
      
      console.log("Source document type:", existingSource.doc_type);
      console.log("Target document types:", targetDocsArray.map(d => d.type));
      
      const comparisonPrompt = COMPARISON_PROMPT
        .replace('{sourceDoc}', sourceDocString)
        .replace('{targetDocs}', targetDocsString);

      console.log("Prompt created with lengths:", {
        totalPromptLength: comparisonPrompt.length,
        sourceDocLength: sourceDocString.length,
        targetDocsLength: targetDocsString.length
      });
      
      // Use Gemini for enhanced comparison
      console.log("🤖 Sending request to Gemini API...");
      const geminiApiKey = localStorage.getItem('Gemini_key') || 'AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk';
      
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey
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

      console.log("Gemini API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error("❌ Gemini API error:", {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData.substring(0, 500)
        });
        throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
      }

      const responseData = await response.json();
      console.log("✅ Gemini API response received");
      console.log("Response structure:", {
        hasCandidates: !!responseData.candidates,
        candidatesLength: responseData.candidates?.length,
        hasContent: !!responseData.candidates?.[0]?.content,
        hasText: !!responseData.candidates?.[0]?.content?.parts?.[0]?.text
      });
      
      if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content) {
        console.error("❌ Invalid response structure:", responseData);
        throw new Error("Invalid response structure from Gemini API");
      }
      
      const responseText = responseData.candidates[0].content.parts[0].text;
      console.log("📄 Gemini response text received, length:", responseText.length);
      console.log("Response preview:", responseText.substring(0, 1000));
      
      // Parse the enhanced comparison results
      console.log("🔍 Parsing comparison results...");
      const comparisonData = parseGeminiResponse(responseText);
      console.log("✅ Comparison data parsed successfully");
      console.log("Comparison data structure:", {
        hasSummary: !!comparisonData.summary,
        hasTargets: !!comparisonData.targets,
        targetsCount: comparisonData.targets?.length || 0,
        summaryKeys: comparisonData.summary ? Object.keys(comparisonData.summary) : []
      });

      if (comparisonData && comparisonData.summary && comparisonData.targets) {
        // Convert to our format
        const uiResults: ComparisonResult[] = [];
        
        // Process each target's field comparisons
        comparisonData.targets.forEach((target: any, targetIndex: number) => {
          console.log(`Processing target ${targetIndex + 1}:`, {
            title: target.title,
            score: target.score,
            fieldsCount: target.fields?.length || 0,
            issues: target.issues?.length || 0
          });
          
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
        console.log("📊 Final match percentage calculated:", percentage);
        
        // Create detailed results object
        const detailedComparisonResult: DetailedComparisonResult = {
          overallMatch: percentage,
          headerResults: uiResults,
          lineItems: [],
          sourceDocument: existingSource,
          targetDocuments: targetDocsArray,
          comparisonSummary: {
            ...comparisonData.summary,
            target_specific_results: comparisonData.targets || []
          }
        };

        // Process line items
        console.log("📋 Processing line items...");
        comparisonData.targets.forEach((target: any, targetIndex: number) => {
          if (target.line_items && Array.isArray(target.line_items)) {
            console.log(`Adding ${target.line_items.length} line items from target ${targetIndex + 1}`);
            target.line_items.forEach((item: any) => {
              detailedComparisonResult.lineItems.push({
                ...item,
                targetIndex: targetIndex
              });
            });
          }
        });
        
        console.log("📊 Final comparison results:", {
          headerResultsCount: uiResults.length,
          matchPercentage: percentage,
          targetDocumentsCount: targetDocsArray.length,
          lineItemsCount: detailedComparisonResult.lineItems.length
        });

        // Store results in database with sorted target titles for consistency
        console.log("💾 Storing comparison results in database...");
        const sortedTargetTitles = [...targetTitles].sort().join(', ');
        
        const { error: insertError } = await supabase
          .from('Doc_Compare_results')
          .insert({
            doc_id_compare: existingSource.id,
            doc_type_source: existingSource.doc_type,
            doc_type_target: sortedTargetTitles,
            doc_compare_count_targets: targetDocsArray.length,
            doc_compare_results: {
              summary: comparisonData.summary,
              targets: comparisonData.targets,
              match_percentage: percentage,
              processed_at: new Date().toISOString(),
              source_document: existingSource,
              target_documents: targetDocsArray,
              raw_response_preview: responseText.substring(0, 2000)
            }
          });

        if (insertError) {
          console.error("❌ Error storing comparison results:", insertError);
        } else {
          console.log("✅ Successfully stored comparison results");
        }
        
        // Update UI state
        setComparisonResults(uiResults);
        setDetailedResults(detailedComparisonResult);
        setMatchPercentage(percentage);
        setActiveTab("results");
        
        console.log("=== COMPARISON COMPLETED SUCCESSFULLY ===");
        
        toast({
          title: "Comparison Complete",
          description: `Documents compared with ${percentage}% overall match across ${targetDocsArray.length} targets`,
        });

        // Dispatch event for dashboard refresh
        window.dispatchEvent(new CustomEvent('comparisonComplete', {
          detail: {
            sourceDoc: existingSource,
            targetDocs: targetDocsArray,
            results: comparisonData,
            matchPercentage: percentage
          }
        }));
        
      } else {
        console.error("❌ Invalid comparison response format:", {
          hasComparisonData: !!comparisonData,
          hasSummary: !!comparisonData?.summary,
          hasTargets: !!comparisonData?.targets,
          actualStructure: comparisonData ? Object.keys(comparisonData) : 'null'
        });
        console.error("Full response data:", comparisonData);
        throw new Error("Invalid comparison response format from Gemini API");
      }

    } catch (error) {
      console.error("=== COMPARISON ERROR ===", {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
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
