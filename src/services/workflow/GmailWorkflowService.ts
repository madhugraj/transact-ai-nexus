
import { supabase } from '@/integrations/supabase/client';

export class GmailWorkflowService {
  async fetchEmailsWithAttachments(filters: any[] = [], useIntelligentFiltering: boolean = false): Promise<any> {
    console.log('📧 GmailWorkflowService: Fetching emails with attachments');
    console.log('📧 Filters:', filters, 'Intelligent filtering:', useIntelligentFiltering);
    
    try {
      // Call the Gmail edge function
      const { data, error } = await supabase.functions.invoke('gmail', {
        body: {
          action: 'listMessages',
          query: 'has:attachment',
          maxResults: 10
        }
      });

      if (error) {
        console.error('❌ Gmail API error:', error);
        throw new Error(`Gmail API error: ${error.message}`);
      }

      if (!data || !data.messages) {
        console.log('⚠️ No messages found');
        return {
          count: 0,
          emails: [],
          files: []
        };
      }

      console.log(`📧 Found ${data.messages.length} messages with attachments`);

      // Process each message to get attachments with content
      const allFiles = [];
      const processedEmails = [];

      for (const message of data.messages) {
        try {
          // Get full message details
          const { data: fullMessage, error: messageError } = await supabase.functions.invoke('gmail', {
            body: {
              action: 'get',
              messageId: message.id
            }
          });

          if (messageError || !fullMessage) {
            console.error('❌ Failed to get message details:', messageError);
            continue;
          }

          processedEmails.push(fullMessage);

          // Extract attachments with actual content
          if (fullMessage.attachments && fullMessage.attachments.length > 0) {
            for (const attachment of fullMessage.attachments) {
              // Get attachment content
              const { data: attachmentData, error: attachmentError } = await supabase.functions.invoke('gmail', {
                body: {
                  action: 'getAttachment',
                  messageId: message.id,
                  attachmentId: attachment.id
                }
              });

              if (attachmentError || !attachmentData) {
                console.error('❌ Failed to get attachment content:', attachmentError);
                continue;
              }

              // Create file object with actual content
              const fileObj = {
                id: attachment.id,
                name: attachment.filename || `attachment_${attachment.id}`,
                filename: attachment.filename || `attachment_${attachment.id}`,
                source: 'gmail',
                emailId: message.id,
                emailSubject: fullMessage.subject || 'No Subject',
                mimeType: attachment.mimeType || 'application/octet-stream',
                size: attachment.size || 0,
                content: attachmentData.data, // This should be base64 content
                type: attachment.mimeType || 'application/octet-stream'
              };

              console.log('📎 Added attachment with content:', {
                name: fileObj.name,
                size: fileObj.size,
                hasContent: !!fileObj.content,
                contentLength: fileObj.content ? fileObj.content.length : 0
              });

              allFiles.push(fileObj);
            }
          }
        } catch (messageError) {
          console.error('❌ Error processing message:', message.id, messageError);
        }
      }

      console.log(`✅ Gmail service processed ${processedEmails.length} emails and ${allFiles.length} files with content`);

      return {
        count: processedEmails.length,
        emails: processedEmails,
        files: allFiles
      };

    } catch (error) {
      console.error('❌ GmailWorkflowService error:', error);
      throw error;
    }
  }
}
