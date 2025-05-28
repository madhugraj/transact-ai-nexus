
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

  const handlePoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPoFile(e.target.files[0]);
      console.log("📁 Source file selected:", e.target.files[0].name);
      toast({
        title: "Source Document Uploaded",
        description: `Successfully uploaded ${e.target.files[0].name}`,
      });
    }
  };

  const handleInvoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      const existingNames = invoiceFiles.map(f => f.name);
      const duplicateFiles = newFiles.filter(f => existingNames.includes(f.name));
      
      if (duplicateFiles.length > 0) {
        console.warn("⚠️ Duplicate files detected:", duplicateFiles.map(f => f.name));
        toast({
          title: "Duplicate Files Detected",
          description: `${duplicateFiles.length} duplicate file(s) were skipped`,
          variant: "destructive",
        });
      }
      
      const uniqueFiles = newFiles.filter(f => !existingNames.includes(f.name));
      
      if (uniqueFiles.length > 0) {
        setInvoiceFiles(prev => [...prev, ...uniqueFiles]);
        console.log("📁 Target files added:", uniqueFiles.map(f => f.name));
        toast({
          title: "Target Document(s) Uploaded",
          description: `Successfully uploaded ${uniqueFiles.length} unique target document(s)`,
        });
      }
    }
  };

  const removeInvoiceFile = (index: number) => {
    const removedFile = invoiceFiles[index];
    console.log("🗑️ Removing target file:", removedFile?.name);
    setInvoiceFiles(invoiceFiles.filter((_, i) => i !== index));
    if (activeInvoiceIndex === index) {
      setActiveInvoiceIndex(-1);
    }
  };

  const parseGeminiResponse = (responseText: string): any => {
    console.log("🔍 Parsing Gemini response...");
    
    try {
      const parsed = JSON.parse(responseText.trim());
      console.log("✅ Successfully parsed JSON directly");
      return parsed;
    } catch (error) {
      console.log("❌ Direct JSON parsing failed, trying extraction...");
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
    throw new Error(`Unable to extract valid JSON from response`);
  };

  const compareDocuments = async () => {
    console.log("=== STARTING DOCUMENT COMPARISON ===");
    
    if (!poFile || invoiceFiles.length === 0) {
      console.error("❌ Missing files");
      toast({
        title: "Missing Documents",
        description: "Please upload both source and at least one target document",
        variant: "destructive",
      });
      return;
    }

    setIsComparing(true);
    
    try {
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

      console.log("✅ Source document found:", existingSource.id);

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
          console.log(`✅ Target document ${i} prepared:`, targetDoc.title);
        }
      }

      if (targetDocsArray.length === 0) {
        console.error("❌ No valid target documents found");
        throw new Error("No target documents found for comparison.");
      }

      console.log(`📋 Total target documents: ${targetDocsArray.length}`);

      // Check for existing comparison
      const sortedTargetTitles = [...targetTitles].sort().join(', ');
      const { data: existingComparison, error: compError } = await supabase
        .from('Doc_Compare_results')
        .select('*')
        .eq('doc_id_compare', existingSource.id)
        .eq('doc_type_target', sortedTargetTitles)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (compError) {
        console.error("❌ Error checking existing comparison:", compError);
      }

      if (existingComparison && existingComparison.doc_compare_results) {
        console.log("🔄 Using existing comparison results");
        
        const storedResults = existingComparison.doc_compare_results;
        
        if (storedResults.summary && storedResults.targets) {
          const uiResults: ComparisonResult[] = [];
          
          storedResults.targets.forEach((target: any, targetIndex: number) => {
            if (target.fields && Array.isArray(target.fields)) {
              target.fields.forEach((field: any) => {
                uiResults.push({
                  field: `${field.field} (${target.title})`,
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
          
          console.log("✅ Setting comparison results with percentage:", percentage);
          setComparisonResults(uiResults);
          setDetailedResults(detailedComparisonResult);
          setMatchPercentage(percentage);
          setActiveTab("results");
          
          toast({
            title: "Existing Comparison Loaded",
            description: `Previously computed comparison with ${percentage}% match loaded`,
          });
          
          return;
        }
      }

      // Create new comparison
      console.log("📝 Creating new comparison...");
      const sourceDocString = JSON.stringify(existingSource.doc_json_extract, null, 2);
      const targetDocsString = JSON.stringify(targetDocsArray, null, 2);
      
      const comparisonPrompt = COMPARISON_PROMPT
        .replace('{sourceDoc}', sourceDocString)
        .replace('{targetDocs}', targetDocsString);

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
        console.error("❌ Gemini API error:", response.status, errorData);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("✅ Gemini API response received");
      
      if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content) {
        console.error("❌ Invalid response structure:", responseData);
        throw new Error("Invalid response structure from Gemini API");
      }
      
      const responseText = responseData.candidates[0].content.parts[0].text;
      console.log("📄 Gemini response received, length:", responseText.length);
      
      const comparisonData = parseGeminiResponse(responseText);
      console.log("✅ Comparison data parsed successfully");

      if (comparisonData && comparisonData.summary && comparisonData.targets) {
        const uiResults: ComparisonResult[] = [];
        
        comparisonData.targets.forEach((target: any, targetIndex: number) => {
          console.log(`Processing target ${targetIndex + 1}:`, target.title);
          
          if (target.fields && Array.isArray(target.fields)) {
            target.fields.forEach((field: any) => {
              uiResults.push({
                field: `${field.field} (${target.title})`,
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
        console.log("📊 Final match percentage:", percentage);
        
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

        comparisonData.targets.forEach((target: any, targetIndex: number) => {
          if (target.line_items && Array.isArray(target.line_items)) {
            target.line_items.forEach((item: any) => {
              detailedComparisonResult.lineItems.push({
                ...item,
                targetIndex: targetIndex
              });
            });
          }
        });
        
        // Store results in database
        console.log("💾 Storing comparison results...");
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
              processed_at: new Date().toISOString()
            }
          });

        if (insertError) {
          console.error("❌ Error storing results:", insertError);
        } else {
          console.log("✅ Results stored successfully");
        }
        
        console.log("✅ Setting UI state with results");
        setComparisonResults(uiResults);
        setDetailedResults(detailedComparisonResult);
        setMatchPercentage(percentage);
        setActiveTab("results");
        
        console.log("=== COMPARISON COMPLETED SUCCESSFULLY ===");
        
        toast({
          title: "Comparison Complete",
          description: `Documents compared with ${percentage}% overall match`,
        });
        
      } else {
        console.error("❌ Invalid comparison response format");
        throw new Error("Invalid comparison response format from Gemini API");
      }

    } catch (error) {
      console.error("=== COMPARISON ERROR ===", error);
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
