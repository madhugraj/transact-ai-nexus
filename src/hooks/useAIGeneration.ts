
import { useState, useEffect } from 'react';
import { generateInsightsWithGemini } from '@/services/api/gemini/insightGenerator';
import { Message } from '@/components/assistant/MessageList';
import { Document } from '@/components/assistant/DocumentSelector.d';
import { supabase } from '@/integrations/supabase/client';

// Enhanced business analyst prompt template with specific instructions for table analysis
export const BUSINESS_ANALYST_PROMPT = `You are a business data analyst. Given the table data and user query, find the answer from the provided table only.

Analyze the output and the original intent to provide a clear explanation and prescriptive business insights.

Instructions:
- Identify patterns, outliers, or anomalies using actual values from the data.
- Perform calculations when appropriate (sums, averages, percentages, growth rates).
- Explain what the result reveals in business terms.
- Recommend 3-5 specific business actions based on the data analysis. Be precise.
- Suggest KPIs or metrics to track going forward.
- Use professional, clear language suitable for business stakeholders.
- Output plain text only. No markdown or code formatting.

Always structure your response with these sections:
1. Summary of findings
2. Key insights (with supporting data points)
3. Business implications
4. Recommended actions`;

/**
 * Format table for AI prompt
 */
const formatTableForPrompt = (documentData: any): string => {
  if (!documentData) return '';
  
  let tableContext = '';
  
  if (documentData.headers && documentData.rows) {
    // Format headers
    const headers = Array.isArray(documentData.headers) 
      ? documentData.headers.join(' | ')
      : Object.values(documentData.headers).join(' | ');
    
    // Format rows
    const rows = Array.isArray(documentData.rows)
      ? documentData.rows
        .map(row => Array.isArray(row) ? row.join(' | ') : Object.values(row).join(' | '))
        .join('\n')
      : [];
    
    tableContext = `Table: ${documentData.name || documentData.title || 'Unknown'}\n\nHeaders: ${headers}\n\nData:\n${rows}`;
  } else if (documentData.data && Array.isArray(documentData.data)) {
    // Handle alternative data structure
    tableContext = JSON.stringify(documentData.data, null, 2);
  } else if (typeof documentData === 'object') {
    // Handle any other structure
    tableContext = JSON.stringify(documentData, null, 2);
  }
  
  return tableContext;
};

/**
 * Hook for AI content generation based on user prompts and documents
 */
export const useAIGeneration = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeminiConfigured, setIsGeminiConfigured] = useState<boolean | null>(null);

  // Check if Gemini API is configured
  useEffect(() => {
    const checkGeminiConfig = async () => {
      try {
        const { data } = await supabase.rpc('get_service_key', { service_name: 'gemini' });
        // Explicitly cast the response to the correct type
        const apiKeys = data as unknown as string[];
        const hasValidKey = apiKeys && Array.isArray(apiKeys) && apiKeys.length > 0;
        setIsGeminiConfigured(hasValidKey);
      } catch (error) {
        console.error("Error checking Gemini configuration:", error);
        setIsGeminiConfigured(false);
      }
    };
    
    checkGeminiConfig();
  }, []);

  /**
   * Generate AI response based on a user message and document data
   */
  const generateAIResponse = async (
    userMessage: string,
    documentData: any | null,
    documentName?: string
  ): Promise<{ content: string; error?: string }> => {
    setIsProcessing(true);
    
    try {
      if (!documentData) {
        return {
          content: documentName
            ? `I'd like to analyze "${documentName}" for you, but I don't have access to its data. Please try selecting another document or uploading a document with extractable data.`
            : "Please select a document from the dropdown above to analyze. I need data to work with in order to provide insights. You can upload and process documents in the Documents section."
        };
      }
      
      if (isGeminiConfigured === false) {
        return {
          content: "⚠️ Gemini API is not configured. To get AI-powered analysis of your documents, please configure a Gemini API key in the settings. Currently using simulated responses.",
          error: "Gemini API not configured"
        };
      }
      
      // Format the table for the prompt
      const tableContext = formatTableForPrompt(documentData);
      
      if (!tableContext) {
        return { 
          content: "I couldn't analyze this document because it doesn't contain any extractable tabular data.",
          error: "No table data available"
        };
      }
      
      // Prepare prompt with context and user query
      const analysisPrompt = `${BUSINESS_ANALYST_PROMPT}
      
Table data:
${tableContext}

User query:
${userMessage}`;
      
      console.log("Calling Gemini API for insights");
      
      // Call Gemini API for insights
      const response = await generateInsightsWithGemini(tableContext, analysisPrompt);
      
      if (response.success && response.data) {
        return {
          content: response.data.insights || response.data.summary || "I've analyzed the data but don't have specific insights to share."
        };
      } else {
        return {
          content: `I couldn't analyze this data due to an error: ${response.error || 'Unknown error'}`,
          error: response.error || 'Failed to generate insights'
        };
      }
    } catch (error) {
      console.error("Error generating AI response:", error);
      return {
        content: "I'm sorry, I encountered an error while analyzing your data. Please try again with a different query or document.",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Generate welcome message when document is selected
   */
  const generateDocumentWelcomeMessage = (doc: Document): Message => {
    return {
      id: Date.now().toString(),
      content: `I've loaded "${doc.name}". What would you like to know about this ${doc.type}? I can provide business insights and recommendations based on this data.`,
      sender: 'assistant',
      timestamp: new Date()
    };
  };

  return {
    isProcessing,
    isGeminiConfigured,
    generateAIResponse,
    generateDocumentWelcomeMessage
  };
};
