
import { supabase } from '@/integrations/supabase/client';

export class GmailWorkflowService {
  async fetchEmailsWithAttachments(filters: string[]): Promise<any> {
    console.log('📧 Fetching real Gmail emails with filters:', filters);
    
    const tokens = localStorage.getItem('gmail_auth_tokens');
    if (!tokens) {
      throw new Error('Gmail authentication required. Please connect your Gmail account first.');
    }

    const { accessToken } = JSON.parse(tokens);
    
    try {
      // Call the Gmail edge function
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

      console.log('✅ Gmail emails fetched successfully:', data);
      
      return {
        source: 'gmail',
        emails: data.messages || [],
        count: data.messages?.length || 0,
        filters: filters
      };
    } catch (error) {
      console.error('❌ Error fetching Gmail emails:', error);
      throw error;
    }
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
