
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
    const body = await req.json();
    console.log('🔧 Google Auth function called with action:', body.action);
    
    const CLIENT_ID = '59647658413-2aq8dou9iikfe6dq6ujsp1aiaku5r985.apps.googleusercontent.com';
    const CLIENT_SECRET = Deno.env.get('Client_secret') || 
                         Deno.env.get('CLIENT_SECRET') || 
                         Deno.env.get('client_secret') ||
                         Deno.env.get('Client secret');

    if (!CLIENT_SECRET) {
      console.error('❌ Google client secret not configured');
      throw new Error('Google client secret not configured');
    }

    // Handle different actions
    if (body.action === 'get_drive_auth_url') {
      console.log('🔗 Generating Drive auth URL with scopes:', body.scopes);
      
      const scopes = body.scopes || ['https://www.googleapis.com/auth/drive.readonly'];
      
      // Get the origin from request headers to determine the correct redirect URI
      const origin = req.headers.get('origin') || 'https://79d72649-d878-4ff4-9672-26026a4d9011.lovableproject.com';
      const redirectUri = `${origin}/oauth/callback`;
      
      console.log('🔧 Using redirect URI:', redirectUri);
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scopes.join(' '));
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');

      console.log('✅ Auth URL generated successfully');
      
      return new Response(
        JSON.stringify({
          success: true,
          authUrl: authUrl.toString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Handle token validation
    if (body.action === 'validate_drive_token') {
      console.log('🔍 Validating Drive token');
      
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${body.accessToken}`,
        },
      });

      const valid = response.ok;
      console.log('🔍 Token validation result:', valid);

      return new Response(
        JSON.stringify({
          success: true,
          valid: valid,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Handle file listing
    if (body.action === 'list_drive_files') {
      console.log('📁 Listing Drive files with query:', body.query);
      
      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.set('fields', 'files(id,name,mimeType,size,modifiedTime,webViewLink)');
      url.searchParams.set('pageSize', '50');
      
      if (body.query) {
        url.searchParams.set('q', body.query);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${body.accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Drive API error:', errorData);
        throw new Error(`Drive API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Found ${data.files?.length || 0} files`);

      return new Response(
        JSON.stringify({
          success: true,
          files: data.files || [],
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Handle file download
    if (body.action === 'download_file') {
      console.log('📥 Downloading file:', body.fileId);
      
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${body.fileId}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${body.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ File download error:', errorData);
        throw new Error(`File download error: ${response.status}`);
      }

      const fileContent = await response.arrayBuffer();
      const base64Content = btoa(String.fromCharCode(...new Uint8Array(fileContent)));

      return new Response(
        JSON.stringify({
          success: true,
          content: base64Content,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Handle legacy token exchange
    const { authCode, redirectUri } = body;
    
    if (!authCode) {
      throw new Error('Authorization code is required');
    }

    console.log('✅ Client secret found, proceeding with token exchange');
    console.log('🔧 Using redirect URI:', redirectUri);

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
        redirect_uri: redirectUri,
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
