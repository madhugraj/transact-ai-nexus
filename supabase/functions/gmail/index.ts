
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, accessToken, query, maxResults, messageId, attachmentId } = await req.json();
    
    console.log(`Making Gmail API request for action: ${action}`);
    
    let url: string;
    let method = 'GET';
    
    switch (action) {
      case 'listMessages':
        url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${encodeURIComponent(query)}`;
        break;
      case 'get':
        url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
        break;
      case 'getAttachment':
        url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`;
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    console.log(`Making Gmail API request: ${url}`);
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gmail API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return new Response(JSON.stringify({
      success: true,
      data: data
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Gmail function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
