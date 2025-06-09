
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { authCode, scope, redirectUri } = await req.json();
    
    console.log('🔧 Google Auth function called with:', { 
      hasAuthCode: !!authCode, 
      redirectUri, 
      timestamp: new Date().toISOString() 
    });
    
    if (!authCode) {
      throw new Error('Authorization code is required');
    }

    const CLIENT_ID = '59647658413-2aq8dou9iikfe6dq6ujsp1aiaku5r985.apps.googleusercontent.com';
    // Try different possible secret names to handle any naming variations
    const CLIENT_SECRET = Deno.env.get('Client_secret') || 
                         Deno.env.get('CLIENT_SECRET') || 
                         Deno.env.get('client_secret') ||
                         Deno.env.get('Client secret');
    
    // Use the redirect URI passed from the client (it will be one of the configured ones)
    const REDIRECT_URI = redirectUri;

    if (!CLIENT_SECRET) {
      console.error('❌ Google client secret not configured');
      console.error('Available environment variables:', Object.keys(Deno.env.toObject()));
      throw new Error('Google client secret not configured');
    }

    console.log('✅ Client secret found, proceeding with token exchange');
    console.log('🔧 Using redirect URI:', REDIRECT_URI);

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: authCode,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('❌ Token exchange error:', errorData);
      throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorData}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token exchange successful');

    return new Response(
      JSON.stringify({
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Google auth error:', error);
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
