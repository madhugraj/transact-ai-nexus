
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
    const { accessToken, action, messageId, query, maxResults, attachmentId } = await req.json();
    
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    let url = 'https://gmail.googleapis.com/gmail/v1/users/me';
    
    if (action === 'list') {
      url += '/messages';
      const queryParams = new URLSearchParams({
        maxResults: maxResults || '50',
      });
      if (query) {
        queryParams.set('q', query);
      }
      url += `?${queryParams}`;
    } else if (action === 'get' && messageId) {
      url += `/messages/${messageId}`;
      const queryParams = new URLSearchParams({
        format: 'full',
      });
      url += `?${queryParams}`;
    } else if (action === 'attachment' && messageId && attachmentId) {
      url += `/messages/${messageId}/attachments/${attachmentId}`;
    }

    console.log(`Making Gmail API request: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gmail API error:', errorData);
      throw new Error(`Gmail API error: ${response.status}`);
    }

    const data = await response.json();

    if (action === 'list') {
      // Get detailed info for each message
      const messages = data.messages || [];
      const detailedMessages = [];

      for (const message of messages.slice(0, 10)) { // Limit to first 10 for performance
        const detailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            },
          }
        );

        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          const headers = detailData.payload?.headers || [];
          
          const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
          const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
          const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString();
          
          detailedMessages.push({
            id: message.id,
            subject,
            from,
            date,
            snippet: detailData.snippet || '',
            hasAttachments: (detailData.payload?.parts || []).some(part => 
              part.filename && part.filename.length > 0
            ),
            labels: detailData.labelIds || [],
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: detailedMessages,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
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
    }

  } catch (error) {
    console.error('Gmail error:', error);
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
