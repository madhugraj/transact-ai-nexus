
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
      
      // Parse the JSON response
      let extractedData;
      try {
        extractedData = JSON.parse(extractedText.trim());
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', extractedText);
        throw new Error('Invalid JSON response from Gemini');
      }
      
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
