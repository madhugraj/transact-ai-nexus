
import { supabase } from '@/integrations/supabase/client';

export class GmailWorkflowService {
  async fetchEmailsWithAttachments(filters: string[]): Promise<any> {
    console.log('📧 Fetching real Gmail emails with filters:', filters);
    
    const tokens = localStorage.getItem('gmail_auth_tokens');
    if (!tokens) {
      throw new Error('Gmail authentication required. Please connect your Gmail account first.');
    }

    const { accessToken, refreshToken } = JSON.parse(tokens);
    
    try {
      // First attempt with current access token
      const result = await this.callGmailAPI(accessToken, filters);
      return result;
    } catch (error: any) {
      // If we get a 401 error, try to refresh the token
      if (error.message?.includes('401') || error.message?.includes('Invalid Credentials')) {
        console.log('🔄 Access token expired, attempting refresh...');
        
        if (!refreshToken) {
          // Clear invalid tokens and throw error
          localStorage.removeItem('gmail_auth_tokens');
          throw new Error('Gmail session expired. Please reconnect your Gmail account.');
        }
        
        try {
          // Attempt to refresh the token
          const newAccessToken = await this.refreshAccessToken(refreshToken);
          
          // Update stored tokens
          const updatedTokens = {
            accessToken: newAccessToken,
            refreshToken: refreshToken
          };
          localStorage.setItem('gmail_auth_tokens', JSON.stringify(updatedTokens));
          
          // Retry the API call with new token
          return await this.callGmailAPI(newAccessToken, filters);
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          // Clear invalid tokens
          localStorage.removeItem('gmail_auth_tokens');
          throw new Error('Gmail session expired. Please reconnect your Gmail account.');
        }
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  private async callGmailAPI(accessToken: string, filters: string[]): Promise<any> {
    const { data, error } = await supabase.functions.invoke('gmail', {
      body: {
        action: 'listMessages',
        accessToken,
        filters: filters.length > 0 ? filters : ['invoice', 'billing'],
        maxResults: 10
      }
    });

    if (error) {
      console.error('❌ Gmail API error:', error);
      throw new Error(`Gmail API error: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Gmail API request failed');
    }

    console.log('✅ Gmail emails fetched successfully:', data);
    
    return {
      source: 'gmail',
      emails: data.data || [],
      count: data.data?.length || 0,
      filters: filters
    };
  }

  private async refreshAccessToken(refreshToken: string): Promise<string> {
    console.log('🔄 Refreshing Gmail access token...');
    
    const { data, error } = await supabase.functions.invoke('google-auth', {
      body: {
        action: 'refresh',
        refreshToken
      }
    });

    if (error || !data.success) {
      throw new Error('Failed to refresh access token');
    }

    console.log('✅ Access token refreshed successfully');
    return data.accessToken;
  }

  async processEmailAttachments(emails: any[]): Promise<any[]> {
    console.log('📎 Processing email attachments for', emails.length, 'emails');
    
    const processedFiles = [];
    
    for (const email of emails.slice(0, 3)) { // Limit to first 3 emails
      if (email.attachments && email.attachments.length > 0) {
        for (const attachment of email.attachments) {
          if (attachment.mimeType === 'application/pdf') {
            processedFiles.push({
              id: attachment.attachmentId,
              name: attachment.filename,
              source: 'gmail',
              emailId: email.id,
              mimeType: attachment.mimeType,
              size: attachment.size
            });
          }
        }
      }
    }
    
    console.log('📎 Found', processedFiles.length, 'PDF attachments');
    return processedFiles;
  }
}
