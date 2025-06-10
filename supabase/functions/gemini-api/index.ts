
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('Gemini_key');

const INVOICE_EXTRACTION_PROMPT = `You are an expert invoice data extraction AI. Extract all relevant information from this invoice document and return it as a structured JSON object.

Extract the following fields:
- invoice_number: The invoice number
- invoice_date: Date in YYYY-MM-DD format
- vendor_name: Name of the vendor/supplier
- po_number: Purchase order number (if present)
- total_amount: Total amount due
- gst_rate: GST/tax rate percentage
- gst_amount: GST/tax amount
- line_items: Array of line items with description, quantity, unit_price, total
- extraction_confidence: Your confidence level (0.0 to 1.0)

Return ONLY valid JSON without any markdown formatting or explanations.`;

// Enhanced JSON parsing function
const parseGeminiResponse = (responseText: string): any => {
  console.log("Raw Gemini response:", responseText);
  
  // First try direct JSON parsing
  try {
    const parsed = JSON.parse(responseText.trim());
    console.log("Direct JSON parsing successful");
    return parsed;
  } catch (error) {
    console.log("Direct JSON parsing failed, trying code block extraction...");
  }
  
  // Try to extract JSON from markdown code blocks
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
  
  // Try to find JSON object using regex
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
  
  console.error("All parsing methods failed for response:", responseText);
  throw new Error(`Unable to extract valid JSON from response: ${responseText.substring(0, 200)}...`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, fileData, fileName, mimeType, prompt } = await req.json();
    
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }
    
    if (action === 'extractInvoiceData') {
      console.log(`Extracting invoice data from: ${fileName}`);
      
      // Prepare the request to Gemini
      const geminiRequest = {
        contents: [{
          parts: [
            { text: INVOICE_EXTRACTION_PROMPT },
            {
              inline_data: {
                mime_type: mimeType,
                data: fileData
              }
            }
          ]
        }]
      };
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiRequest),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);
        throw new Error(`Gemini API error: ${response.status}`);
      }
      
      const result = await response.json();
      const extractedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!extractedText) {
        throw new Error('No response from Gemini API');
      }
      
      // Parse the JSON response using enhanced parsing
      const extractedData = parseGeminiResponse(extractedText);
      
      console.log('Successfully extracted invoice data:', extractedData);
      
      return new Response(JSON.stringify({
        success: true,
        data: extractedData
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Handle other actions (existing functionality)
    const geminiRequest = {
      contents: [{
        parts: [{ text: prompt || 'Analyze this document' }]
      }]
    };
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequest),
    });
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    return new Response(JSON.stringify({
      success: true,
      data: result.candidates?.[0]?.content?.parts?.[0]?.text || 'No response'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Gemini function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
