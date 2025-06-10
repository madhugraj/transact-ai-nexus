

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
    // Build search query - Pass the useIntelligentFiltering parameter correctly
    let searchQuery = '';
    
    if (useIntelligentFiltering) {
      // Enhanced query for invoice detection
      const invoiceKeywords = [
        'invoice', 'billing', 'payment', 'receipt', 'statement', 
        'purchase order', 'PO', 'remittance', 'payable', 
        'due', 'amount', 'total', 'tax', 'vat'
      ];
      
      // Combine user filters with AI-enhanced keywords
      const allKeywords = [...new Set([...filters, ...invoiceKeywords])];
      searchQuery = `(${allKeywords.join(' OR ')}) AND has:attachment`;
      console.log('🤖 Using AI-enhanced search with attachments filter');
    } else if (filters.length > 0) {
      searchQuery = `(${filters.join(' OR ')}) AND has:attachment`;
      console.log('📧 Using manual filters with attachments filter');
    } else {
      // Default fallback
      searchQuery = '(invoice OR billing) AND has:attachment';
      console.log('🔄 Using default search with attachments filter');
    }

    console.log('🔍 Gmail search query:', searchQuery);

    try {
      const { data, error } = await supabase.functions.invoke('gmail', {
        body: {
          action: 'listMessages',
          accessToken,
          query: searchQuery,
          maxResults: useIntelligentFiltering ? 20 : 10 // More results when using AI
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

      console.log('✅ Gmail emails fetched successfully:', data.data?.length || 0, 'emails');
      
      let filteredEmails = data.data || [];

      // Apply intelligent filtering if enabled
      if (useIntelligentFiltering && filteredEmails.length > 0) {
        console.log('🤖 Applying AI-powered invoice detection...');
        filteredEmails = await this.applyIntelligentFiltering(filteredEmails);
      }
      
      return {
        source: 'gmail',
        emails: filteredEmails,
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
    
    let confidence = 0.3; // Base confidence
    
    // Strong keywords boost confidence significantly
    const strongKeywords = ['invoice', 'bill', 'payment due', 'purchase order'];
    strongKeywords.forEach(keyword => {
      if (fullText.includes(keyword)) confidence += 0.2;
    });
    
    // Attachments are crucial for invoices
    if (email.hasAttachments) confidence += 0.2;
    
    // Business email domains
    if (from.includes('.com') || from.includes('.org') || from.includes('.net')) {
      confidence += 0.1;
    }
    
    // Not from personal email services
    if (!from.includes('gmail.com') && !from.includes('yahoo.com') && !from.includes('hotmail.com')) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  private getInvoiceReasons(email: any): string[] {
    const reasons = [];
    const subject = email.subject?.toLowerCase() || '';
    const fullText = `${subject} ${email.from?.toLowerCase() || ''} ${email.snippet?.toLowerCase() || ''}`;
    
    if (fullText.includes('invoice')) reasons.push('Contains "invoice" keyword');
    if (fullText.includes('bill')) reasons.push('Contains billing keywords');
    if (fullText.includes('payment')) reasons.push('Contains payment references');
    if (email.hasAttachments) reasons.push('Has attachments');
    if (fullText.includes('purchase order') || fullText.includes('po #')) reasons.push('References purchase order');
    
    return reasons;
  }

  private async refreshAccessToken(refreshToken: string): Promise<string> {
    console.log('🔄 Refreshing Gmail access token...');
    
    try {
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: {
          action: 'refresh',
          refreshToken
        }
      });

      if (error || !data?.success) {
        throw new Error('Failed to refresh access token');
      }

      console.log('✅ Access token refreshed successfully');
      return data.accessToken;
    } catch (error: any) {
      console.error('❌ Error refreshing token:', error);
      throw new Error('Failed to refresh Gmail authentication. Please reconnect your account.');
    }
  }

  async processEmailAttachments(emails: any[]): Promise<any[]> {
    // Defensive check to ensure emails is an array
    if (!Array.isArray(emails)) {
      console.error('❌ processEmailAttachments received non-array input:', typeof emails, emails);
      return [];
    }
    
    console.log('📎 Processing email attachments for', emails.length, 'emails');
    
    const processedFiles = [];
    const tokens = localStorage.getItem('gmail_auth_tokens');
    if (!tokens) {
      console.error('❌ No Gmail tokens available for attachment processing');
      return [];
    }

    const { accessToken } = JSON.parse(tokens);
    
    for (const email of emails.slice(0, 5)) { // Limit to first 5 emails
      console.log('📧 Processing email:', email.id, 'Subject:', email.subject);
      
      try {
        // Get full email details with attachments
        const { data, error } = await supabase.functions.invoke('gmail', {
          body: {
            action: 'get',
            accessToken,
            messageId: email.id
          }
        });

        if (error || !data?.success) {
          console.error('❌ Failed to get email details for:', email.id, error || data?.error);
          continue;
        }

        const fullEmail = data.data;
        console.log('📧 Full email retrieved for:', email.id);

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
              emailId: email.id,
              emailSubject: email.subject,
              mimeType: attachment.mimeType,
              size: attachment.size,
              aiConfidence: email.aiConfidence,
              aiReason: email.aiReason
            });
            console.log('📄 Added PDF attachment:', attachment.filename);
          }
        }
      } catch (error) {
        console.error('❌ Error processing email attachments for:', email.id, error);
      }
    }
    
    console.log('📎 Found', processedFiles.length, 'PDF attachments total');
    return processedFiles;
  }

  private extractAttachmentsFromParts(parts: any[]): any[] {
    const attachments: any[] = [];
    
    for (const part of parts) {
      // Check if this part has an attachment
      if (part.body?.attachmentId && part.filename) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body.size || 0,
          attachmentId: part.body.attachmentId
        });
        console.log('📎 Found attachment in part:', part.filename, part.mimeType);
      }
      
      // Recursively check nested parts
      if (part.parts && Array.isArray(part.parts)) {
        const nestedAttachments = this.extractAttachmentsFromParts(part.parts);
        attachments.push(...nestedAttachments);
      }
    }
    
    return attachments;
  }
}

