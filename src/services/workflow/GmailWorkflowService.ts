import { supabase } from '@/integrations/supabase/client';

export class GmailWorkflowService {
  async fetchEmailsWithAttachments(filters: string[], useIntelligentFiltering = false): Promise<any> {
    console.log('📧 Fetching Gmail emails with filters:', filters);
    console.log('🤖 Intelligent filtering enabled:', useIntelligentFiltering);
    
    const tokens = localStorage.getItem('gmail_auth_tokens');
    if (!tokens) {
      throw new Error('Gmail authentication required. Please connect your Gmail account first.');
    }

    const { accessToken, refreshToken } = JSON.parse(tokens);
    
    try {
      // First attempt with current access token
      const result = await this.callGmailAPIWithRetry(accessToken, filters, useIntelligentFiltering);
      return result;
    } catch (error: any) {
      console.error('❌ Primary Gmail API call failed:', error);
      
      // If we get a 401 error or network error, try to refresh the token
      if (error.message?.includes('401') || 
          error.message?.includes('Invalid Credentials') ||
          error.message?.includes('Failed to send a request to the Edge Function')) {
        console.log('🔄 Attempting token refresh due to error...');
        
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
          return await this.callGmailAPIWithRetry(newAccessToken, filters, useIntelligentFiltering);
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

  private async callGmailAPIWithRetry(accessToken: string, filters: string[], useIntelligentFiltering: boolean, retries = 3): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 Gmail API attempt ${attempt}/${retries}`);
        return await this.callGmailAPI(accessToken, filters, useIntelligentFiltering);
      } catch (error: any) {
        console.error(`❌ Gmail API attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private async callGmailAPI(accessToken: string, filters: string[], useIntelligentFiltering: boolean): Promise<any> {
    // Build search query - make it less restrictive to find emails
    let searchQuery = '';
    
    if (useIntelligentFiltering) {
      // Start with a broader search first
      searchQuery = 'has:attachment';
      console.log('🤖 Using broad search first to find all emails with attachments');
    } else if (filters.length > 0) {
      searchQuery = `(${filters.join(' OR ')}) AND has:attachment`;
      console.log('📧 Using manual filters with attachments filter');
    } else {
      // Very broad fallback
      searchQuery = 'has:attachment';
      console.log('🔄 Using very broad search for any emails with attachments');
    }

    console.log('🔍 Gmail search query:', searchQuery);

    try {
      // First, get the list of message IDs
      const { data, error } = await supabase.functions.invoke('gmail', {
        body: {
          action: 'listMessages',
          accessToken,
          query: searchQuery,
          maxResults: 10 // Reduce for testing
        }
      });

      if (error) {
        console.error('❌ Gmail API error:', error);
        throw new Error(`Gmail API error: ${error.message}`);
      }

      if (!data || !data.success) {
        console.error('❌ Gmail API request failed:', data?.error);
        throw new Error(data?.error || 'Gmail API request failed');
      }

      console.log('✅ Gmail API raw response:', data);
      
      // Parse the response correctly
      let messageIds = [];
      if (data.data && data.data.messages) {
        messageIds = data.data.messages.map((msg: any) => msg.id);
        console.log('📧 Found message IDs:', messageIds.length);
      } else {
        console.log('⚠️ No messages found in Gmail response');
        return {
          source: 'gmail',
          emails: [],
          files: [],
          count: 0,
          filters: filters,
          intelligentFiltering: useIntelligentFiltering,
          searchQuery
        };
      }

      // Now fetch full details for each message to get attachments
      const emails = [];
      const processedFiles = [];

      for (const messageId of messageIds.slice(0, 5)) { // Process first 5 emails
        try {
          console.log('📧 Fetching full email details for:', messageId);
          
          const { data: emailData, error: emailError } = await supabase.functions.invoke('gmail', {
            body: {
              action: 'get',
              accessToken,
              messageId
            }
          });

          if (emailError || !emailData?.success) {
            console.error('❌ Failed to get email details for:', messageId, emailError || emailData?.error);
            continue;
          }

          const fullEmail = emailData.data;
          console.log('📧 Full email retrieved for:', messageId);

          // Create email object
          const email = {
            id: messageId,
            subject: this.extractSubject(fullEmail.payload?.headers || []),
            from: this.extractFrom(fullEmail.payload?.headers || []),
            date: new Date(parseInt(fullEmail.internalDate)).toISOString(),
            snippet: fullEmail.snippet || '',
            hasAttachments: true,
            labels: fullEmail.labelIds || []
          };

          emails.push(email);

          // Extract attachments from email parts
          const attachments = this.extractAttachmentsFromParts(fullEmail.payload?.parts || []);
          console.log('📎 Found attachments in email:', attachments.length);

          for (const attachment of attachments) {
            if (attachment.mimeType === 'application/pdf' || 
                attachment.mimeType?.toLowerCase().includes('pdf')) {
              processedFiles.push({
                id: attachment.attachmentId,
                name: attachment.filename,
                source: 'gmail',
                emailId: messageId,
                emailSubject: email.subject,
                mimeType: attachment.mimeType,
                size: attachment.size
              });
              console.log('📄 Added PDF attachment:', attachment.filename);
            }
          }
        } catch (error) {
          console.error('❌ Error processing email:', messageId, error);
        }
      }

      console.log('✅ Gmail emails processed successfully:', emails.length, 'emails');
      console.log('📎 Found', processedFiles.length, 'PDF attachments total');
      
      let filteredEmails = emails;

      // Apply intelligent filtering if enabled and we have emails
      if (useIntelligentFiltering && filteredEmails.length > 0) {
        console.log('🤖 Applying AI-powered invoice detection...');
        filteredEmails = await this.applyIntelligentFiltering(filteredEmails);
      }
      
      return {
        source: 'gmail',
        emails: filteredEmails,
        files: processedFiles,
        count: filteredEmails.length,
        filters: filters,
        intelligentFiltering: useIntelligentFiltering,
        searchQuery
      };
    } catch (networkError: any) {
      console.error('❌ Network error calling Gmail API:', networkError);
      
      // Provide more specific error messages
      if (networkError.message?.includes('Failed to send a request to the Edge Function')) {
        throw new Error('Unable to connect to Gmail service. Please check your internet connection and try again.');
      }
      
      throw networkError;
    }
  }

  private extractSubject(headers: any[]): string {
    const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');
    return subjectHeader?.value || 'No Subject';
  }

  private extractFrom(headers: any[]): string {
    const fromHeader = headers.find(h => h.name.toLowerCase() === 'from');
    return fromHeader?.value || 'Unknown Sender';
  }

  private async applyIntelligentFiltering(emails: any[]): Promise<any[]> {
    const filteredEmails = [];
    
    for (const email of emails) {
      try {
        // AI-based content analysis
        const isLikelyInvoice = this.analyzeEmailForInvoiceIndicators(email);
        
        if (isLikelyInvoice) {
          email.aiConfidence = this.calculateInvoiceConfidence(email);
          email.aiReason = this.getInvoiceReasons(email);
          filteredEmails.push(email);
        }
        
      } catch (error) {
        console.error('❌ Error in AI filtering for email:', email.id, error);
        // Include email anyway if AI analysis fails
        filteredEmails.push(email);
      }
    }
    
    console.log(`🤖 AI filtering: ${filteredEmails.length}/${emails.length} emails passed invoice detection`);
    
    // Sort by AI confidence if available
    filteredEmails.sort((a, b) => (b.aiConfidence || 0.5) - (a.aiConfidence || 0.5));
    
    return filteredEmails;
  }

  private analyzeEmailForInvoiceIndicators(email: any): boolean {
    const subject = email.subject?.toLowerCase() || '';
    const from = email.from?.toLowerCase() || '';
    const snippet = email.snippet?.toLowerCase() || '';
    
    const strongInvoiceIndicators = [
      'invoice', 'bill', 'payment due', 'amount due', 'remittance',
      'purchase order', 'po #', 'po#', 'receipt', 'statement'
    ];
    
    const weakInvoiceIndicators = [
      'billing', 'payment', 'due', 'total', 'amount', 'charge',
      'expense', 'cost', 'fee', 'tax', 'vat', 'gst'
    ];
    
    const businessIndicators = [
      'vendor', 'supplier', 'accounting', 'finance', 'sales',
      'customer', 'client', 'order', 'delivery'
    ];
    
    const fullText = `${subject} ${from} ${snippet}`;
    
    // Strong indicators give high confidence
    const hasStrongIndicators = strongInvoiceIndicators.some(indicator => 
      fullText.includes(indicator)
    );
    
    // Weak indicators need to be combined with other factors
    const hasWeakIndicators = weakInvoiceIndicators.some(indicator => 
      fullText.includes(indicator)
    );
    
    const hasBusinessContext = businessIndicators.some(indicator => 
      fullText.includes(indicator)
    );
    
    // Must have attachments for invoice likelihood
    const hasAttachments = email.hasAttachments;
    
    // Decision logic
    return hasStrongIndicators || 
           (hasWeakIndicators && hasBusinessContext && hasAttachments) ||
           (hasAttachments && hasBusinessContext && (hasWeakIndicators || subject.includes('re:')));
  }

  private calculateInvoiceConfidence(email: any): number {
    const subject = email.subject?.toLowerCase() || '';
    const from = email.from?.toLowerCase() || '';
    const snippet = email.snippet?.toLowerCase() || '';
    const fullText = `${subject} ${from} ${snippet}`;
    
    let confidence = 0.5; // Base confidence
    
    // Strong invoice indicators
    if (subject.includes('invoice') || subject.includes('bill')) confidence += 0.3;
    if (subject.includes('payment due') || subject.includes('amount due')) confidence += 0.2;
    if (from.includes('accounting') || from.includes('billing')) confidence += 0.2;
    if (snippet.includes('invoice') || snippet.includes('payment')) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private getInvoiceReasons(email: any): string[] {
    const reasons = [];
    const subject = email.subject?.toLowerCase() || '';
    const from = email.from?.toLowerCase() || '';
    
    if (subject.includes('invoice')) reasons.push('Subject contains "invoice"');
    if (subject.includes('bill')) reasons.push('Subject contains "bill"');
    if (from.includes('accounting')) reasons.push('From accounting department');
    if (email.hasAttachments) reasons.push('Has attachments');
    
    return reasons;
  }

  private async refreshAccessToken(refreshToken: string): Promise<string> {
    console.log('🔄 Attempting to refresh Gmail access token...');
    
    try {
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: {
          refresh_token: refreshToken,
          action: 'refresh'
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Token refresh failed');
      }

      console.log('✅ Access token refreshed successfully');
      return data.access_token;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  private extractAttachmentsFromParts(parts: any[]): any[] {
    const attachments: any[] = [];
    
    const extractFromPart = (part: any) => {
      // Check if this part has an attachment
      if (part.body?.attachmentId && part.filename) {
        attachments.push({
          attachmentId: part.body.attachmentId,
          filename: part.filename,
          mimeType: part.mimeType || 'application/octet-stream',
          size: part.body.size || 0
        });
      }
      
      // Recursively check nested parts
      if (part.parts && Array.isArray(part.parts)) {
        part.parts.forEach(extractFromPart);
      }
    };
    
    parts.forEach(extractFromPart);
    return attachments;
  }
}
