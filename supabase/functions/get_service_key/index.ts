
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // Parse request data
    const { service_name } = await req.json()
    
    // Check if service name is provided
    if (!service_name) {
      return new Response(
        JSON.stringify({ error: 'Service name is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Get the API key from environment variables
    let apiKey = null
    
    switch(service_name.toLowerCase()) {
      case 'gemini':
        // Try to get the API key from the stored Supabase secret first
        apiKey = Deno.env.get('Gemini_key') || null;
        if (!apiKey) {
          // Fallback to the default key only if Gemini_key is not set
          apiKey = "AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk";
          console.log("Using fallback API key for Gemini");
        } else {
          console.log("Using configured Gemini API key from secrets");
        }
        break;
      // Add other services as needed
      default:
        return new Response(
          JSON.stringify({ error: 'Unsupported service' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
    
    // Return the API key as an array to match the expected return type
    return new Response(
      JSON.stringify([apiKey]),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error("Error in get_service_key:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
