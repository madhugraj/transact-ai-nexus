
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
    const { accessToken, action, fileId, folderId } = await req.json();
    
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    let url = 'https://www.googleapis.com/drive/v3/files';
    let queryParams = new URLSearchParams({
      fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,parents)',
      pageSize: '100',
    });

    // Handle different actions
    if (action === 'list') {
      if (folderId) {
        queryParams.set('q', `'${folderId}' in parents and trashed=false`);
      } else {
        queryParams.set('q', 'trashed=false');
      }
    } else if (action === 'download' && fileId) {
      url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
      queryParams = new URLSearchParams({
        alt: 'media',
      });
    } else if (action === 'export' && fileId) {
      // For Google Docs, Sheets, etc.
      url = `https://www.googleapis.com/drive/v3/files/${fileId}/export`;
      queryParams = new URLSearchParams({
        mimeType: 'application/pdf', // Default export format
      });
    }

    console.log(`Making Google Drive API request: ${url}?${queryParams}`);

    const response = await fetch(`${url}?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Google Drive API error:', errorData);
      throw new Error(`Google Drive API error: ${response.status}`);
    }

    if (action === 'download' || action === 'export') {
      // Return file content as blob
      const blob = await response.blob();
      return new Response(blob, {
        headers: {
          ...corsHeaders,
          'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        },
      });
    } else {
      // Return JSON data
      const data = await response.json();
      return new Response(
        JSON.stringify({
          success: true,
          data: data.files || data,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

  } catch (error) {
    console.error('Google Drive error:', error);
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
