
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
    const requestBody = await req.json();
    console.log('Gmail function received request:', requestBody);
    
    const { action, accessToken, query, maxResults, messageId, attachmentId } = requestBody;
    
    if (!accessToken) {
      console.error('❌ No access token provided');
      return new Response(JSON.stringify({
        success: false,
        error: 'Access token is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`📧 Making Gmail API request for action: ${action}`);
    
    let url: string;
    let method = 'GET';
    
    switch (action) {
      case 'list':
      case 'listMessages':
        url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults || 10}&q=${encodeURIComponent(query || 'has:attachment')}`;
        break;
      case 'get':
        if (!messageId) {
          throw new Error('Message ID is required for get action');
        }
        url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
        break;
      case 'getAttachment':
        if (!messageId || !attachmentId) {
          throw new Error('Message ID and Attachment ID are required for getAttachment action');
        }
        url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`;
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    console.log(`🔗 Making Gmail API request: ${url}`);
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gmail API error: ${response.status} ${response.statusText}`, errorText);
      
      // Handle specific error cases
      if (response.status === 401) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authentication failed - please reconnect your Gmail account',
          code: 'AUTH_EXPIRED'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Gmail API request successful for action: ${action}`);
    
    // For attachment requests, add metadata
    if (action === 'getAttachment') {
      return new Response(JSON.stringify({
        success: true,
        data: {
          ...data,
          attachmentId,
          messageId
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: data
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('❌ Gmail function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
