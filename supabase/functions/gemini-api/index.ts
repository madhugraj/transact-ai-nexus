
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Gemini API key from Supabase secrets
    const geminiApiKey = Deno.env.get('Gemini_key');
    
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const { prompt, model = 'gemini-1.5-flash', fileData } = await req.json();
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
    
    let requestBody;
    
    if (fileData) {
      // Handle file upload with vision
      requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: fileData.mimeType,
                  data: fileData.data
                }
              }
            ]
          }
        ]
      };
    } else {
      // Handle text-only request
      requestBody = {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      };
    }

    console.log(`Making Gemini API request to: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        data,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Gemini API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
