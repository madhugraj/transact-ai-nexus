
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
        apiKey = Deno.env.get('GEMINI_API_KEY')
        break;
      // Add other services as needed
      default:
        return new Response(
          JSON.stringify({ error: 'Unsupported service' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
    
    // Return the API key
    return new Response(
      JSON.stringify({ key: apiKey }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
