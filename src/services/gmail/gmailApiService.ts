
import { supabase } from '@/integrations/supabase/client';

export interface GmailApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class GmailApiService {
  constructor(private accessToken: string) {}

  async getMessageDetails(messageId: string): Promise<GmailApiResponse> {
    try {
      console.log(`Getting message details for: ${messageId}`);
      
      const { data, error } = await supabase.functions.invoke('gmail', {
        body: {
          accessToken: this.accessToken,
          action: 'get',
          messageId
        }
      });

      if (error) {
        console.error('Gmail API error:', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        console.error('Gmail API returned error:', data.error);
        return { success: false, error: data.error };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error getting message details:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async downloadAttachment(messageId: string, attachmentId: string): Promise<GmailApiResponse> {
    try {
      console.log(`Downloading attachment ${attachmentId} from message ${messageId}`);
      
      const { data, error } = await supabase.functions.invoke('gmail', {
        body: {
          accessToken: this.accessToken,
          action: 'attachment',
          messageId,
          attachmentId
        }
      });

      if (error) {
        console.error('Gmail attachment API error:', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        console.error('Gmail attachment API returned error:', data.error);
        return { success: false, error: data.error };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error downloading attachment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
