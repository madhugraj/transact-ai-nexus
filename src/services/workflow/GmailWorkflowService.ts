
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
      const result = await this.callGmailAPI(accessToken, filters, useIntelligentFiltering);
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
          return await this.callGmailAPI(newAccessToken, filters, useIntelligentFiltering);
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

  private async callGmailAPI(accessToken: string, filters: string[], useIntelligentFiltering: boolean): Promise<any> {
    // Build search query
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
    } else if (filters.length > 0) {
      searchQuery = filters.join(' OR ');
    } else {
      // Default fallback
      searchQuery = 'invoice OR billing';
    }

    console.log('🔍 Gmail search query:', searchQuery);

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

    if (!data.success) {
      throw new Error(data.error || 'Gmail API request failed');
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
              size: attachment.size,
              aiConfidence: email.aiConfidence,
              aiReason: email.aiReason
            });
          }
        }
      }
    }
    
    console.log('📎 Found', processedFiles.length, 'PDF attachments');
    return processedFiles;
  }
}
