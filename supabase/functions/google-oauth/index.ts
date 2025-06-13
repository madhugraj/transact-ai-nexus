
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
    const { code, redirectUri } = await req.json();
    console.log('🔄 Google OAuth token exchange starting...');
    
    if (!code) {
      throw new Error('Authorization code is required');
    }

    // Get the client secret from environment variables
    const CLIENT_ID = '59647658413-2aq8dou9iikfe6dq6ujsp1aiaku5r985.apps.googleusercontent.com';
    const CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') || 
                         Deno.env.get('Client_secret') || 
                         Deno.env.get('CLIENT_SECRET') ||
                         Deno.env.get('client_secret');

    if (!CLIENT_SECRET) {
      console.error('❌ Google client secret not configured');
      throw new Error('Google client secret not configured. Please add GOOGLE_CLIENT_SECRET to your Supabase secrets.');
    }

    console.log('✅ Client secret found, proceeding with token exchange');

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('❌ Token exchange failed:', errorData);
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token exchange successful');

    return new Response(JSON.stringify({
      success: true,
      data: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ OAuth error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'OAuth exchange failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
