import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { GoogleAuthService } from '@/services/auth/googleAuthService';
import CompactAuthDialog from '@/components/auth/CompactAuthDialog';
import GmailSearchControls from './GmailSearchControls';
import EmailList from './EmailList';
import EmailInvoiceProcessor from '../EmailInvoiceProcessor';

interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  hasAttachments: boolean;
  labels: string[];
}

interface GmailConnectorProps {
  onEmailsImported?: (emails: GmailMessage[]) => void;
}

const GmailConnectorRefactored = ({ onEmailsImported }: GmailConnectorProps) => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<GmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxResults, setMaxResults] = useState('50');
  const [accessToken, setAccessToken] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [hasLoadedInitialEmails, setHasLoadedInitialEmails] = useState(false);
  const { toast } = useToast();

  const redirectUri = `${window.location.origin}/oauth/callback`;

  // Use DYNAMIC redirect URI based on current origin - FIXED
  const authService = new GoogleAuthService({
    clientId: '59647658413-2aq8dou9iikfe6dq6ujsp1aiaku5r985.apps.googleusercontent.com',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    redirectUri: redirectUri
  }, 'gmail_auth_tokens');

  // Enhanced authentication check with better persistence
  React.useEffect(() => {
    console.log('Gmail connector mounted, checking for stored tokens...');
    
    const checkStoredAuth = () => {
      const hasValidTokens = authService.hasValidTokens();
      const tokens = authService.getStoredTokens();
      
      console.log('Auth check results:', { hasValidTokens, hasAccessToken: !!tokens?.accessToken });
      
      if (hasValidTokens && tokens && tokens.accessToken) {
        console.log('Found valid stored tokens, setting connected state');
        setAccessToken(tokens.accessToken);
        setIsConnected(true);
        
        // Only load emails if we haven't loaded them yet
        if (!hasLoadedInitialEmails) {
          console.log('Loading initial emails...');
          loadGmailMessages(tokens.accessToken);
          setHasLoadedInitialEmails(true);
        }
      } else {
        console.log('No valid tokens found, user needs to authenticate');
        setIsConnected(false);
        setAccessToken('');
        setHasLoadedInitialEmails(false);
      }
    };

    // Check immediately and also set up a listener for storage changes
    checkStoredAuth();
    
    // Listen for storage changes (in case user authenticates in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'gmail_auth_tokens') {
        console.log('Storage changed, rechecking auth...');
        checkStoredAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [hasLoadedInitialEmails]);

  const handleGmailAuth = async () => {
    console.log('🔗 Starting Gmail authentication with redirect URI:', `${window.location.origin}/oauth/callback`);
    setIsConnecting(true);
    setAuthError('');

    try {
      const result = await authService.authenticateWithPopup();
      console.log('📧 Authentication result:', result);
      
      if (result.success && result.accessToken) {
        setAccessToken(result.accessToken);
        setIsConnected(true);
        setShowAuthDialog(false);
        setHasLoadedInitialEmails(false);
        
        // Test the connection immediately
        await loadGmailMessages(result.accessToken);
        setHasLoadedInitialEmails(true);
        
        toast({
          title: "Connected to Gmail",
          description: "Successfully authenticated with your Gmail account."
        });
      } else {
        console.error('❌ Authentication failed:', result.error);
        
        // Provide specific error messages for common issues
        let errorMessage = result.error || 'Authentication failed';
        if (result.error?.includes('redirect_uri_mismatch')) {
          errorMessage = 'Redirect URI mismatch. Please ensure your Google Cloud Console is configured correctly.';
        } else if (result.error?.includes('popup')) {
          errorMessage = 'Please allow popups for this site and try again.';
        }
        
        setAuthError(errorMessage);
        toast({
          title: "Authentication Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setAuthError(errorMessage);
      
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    console.log('Disconnecting from Gmail...');
    authService.clearTokens();
    setIsConnected(false);
    setEmails([]);
    setSelectedEmails([]);
    setAccessToken('');
    setShowAuthDialog(false);
    setHasLoadedInitialEmails(false);
    
    toast({
      title: "Disconnected",
      description: "Gmail connection has been removed"
    });
  };

  const extractHeaderValue = (headers: any[], name: string): string => {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header?.value || '';
  };

  const loadGmailMessages = async (token: string, forceRefresh: boolean = false) => {
    console.log('📧 Loading Gmail messages...', forceRefresh ? '(forced refresh)' : '');
    setIsLoading(true);
    setAuthError(''); // Clear any previous errors
    
    try {
      // First, get the list of message IDs with proper error handling
      const { data, error } = await supabase.functions.invoke('gmail', {
        body: {
          accessToken: token,
          action: 'listMessages',
          query: searchQuery || 'has:attachment',
          maxResults: parseInt(maxResults)
        }
      });

      if (error) {
        console.error('❌ Gmail API error:', error);
        
        // Handle authentication errors specifically
        if (error.message && (error.message.includes('401') || error.message.includes('invalid_grant'))) {
          console.log('🔄 Authentication expired, clearing tokens...');
          authService.clearTokens();
          setIsConnected(false);
          setAccessToken('');
          setHasLoadedInitialEmails(false);
          setAuthError('Your Gmail session has expired. Please reconnect.');
          
          toast({
            title: "Session Expired",
            description: "Please reconnect to Gmail to continue.",
            variant: "destructive"
          });
          return;
        }
        
        throw new Error(error.message || 'Failed to fetch emails');
      }

      console.log('📧 Gmail messages response:', data);
      
      if (data.success && data.data?.messages) {
        const messageIds = data.data.messages.map((msg: any) => msg.id);
        console.log(`📧 Found ${messageIds.length} message IDs, fetching details...`);
        
        // Fetch full details for first 10 messages with better error handling
        const emailPromises = messageIds.slice(0, 10).map(async (messageId: string) => {
          try {
            const { data: emailData, error: emailError } = await supabase.functions.invoke('gmail', {
              body: {
                accessToken: token,
                action: 'get',
                messageId
              }
            });

            if (emailError || !emailData?.success) {
              console.error('❌ Failed to get email details for:', messageId, emailError || emailData?.error);
              return null;
            }

            const fullEmail = emailData.data;
            const headers = fullEmail.payload?.headers || [];
            
            const hasAttachments = checkForAttachments(fullEmail.payload);
            
            return {
              id: messageId,
              subject: extractHeaderValue(headers, 'subject') || 'No Subject',
              from: extractHeaderValue(headers, 'from') || 'Unknown Sender',
              date: new Date(parseInt(fullEmail.internalDate)).toISOString(),
              snippet: fullEmail.snippet || '',
              hasAttachments,
              labels: fullEmail.labelIds || []
            };
          } catch (error) {
            console.error('❌ Error processing email:', messageId, error);
            return null;
          }
        });

        const emailResults = await Promise.all(emailPromises);
        const validEmails = emailResults.filter(email => email !== null) as GmailMessage[];
        
        setEmails(validEmails);
        console.log(`✅ Successfully loaded ${validEmails.length} emails`);
        
        if (forceRefresh) {
          toast({
            title: "Emails Refreshed",
            description: `Loaded ${validEmails.length} emails from Gmail`
          });
        }
      } else {
        console.log('⚠️ No messages found or API call failed');
        setEmails([]);
        
        if (forceRefresh) {
          toast({
            title: "No Emails Found",
            description: "No emails with attachments were found matching your search."
          });
        }
      }
    } catch (error) {
      console.error('❌ Error loading emails:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load emails from Gmail";
      setAuthError(errorMessage);
      
      toast({
        title: "Error Loading Emails",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkForAttachments = (payload: any): boolean => {
    if (!payload) return false;
    
    // Check if payload has parts
    if (payload.parts && Array.isArray(payload.parts)) {
      return payload.parts.some((part: any) => {
        // Check if this part has an attachment
        if (part.body?.attachmentId && part.filename) {
          return true;
        }
        // Recursively check nested parts
        if (part.parts) {
          return checkForAttachments({ parts: part.parts });
        }
        return false;
      });
    }
    
    // Check if the main payload itself is an attachment
    return !!(payload.body?.attachmentId && payload.filename);
  };

  const toggleEmailSelection = (email: GmailMessage) => {
    setSelectedEmails(prev => {
      const isSelected = prev.some(e => e.id === email.id);
      if (isSelected) {
        return prev.filter(e => e.id !== email.id);
      } else {
        return [...prev, email];
      }
    });
  };

  const handleSearch = () => {
    if (accessToken) {
      loadGmailMessages(accessToken);
    }
  };

  const handleRefresh = () => {
    console.log('Refresh button clicked');
    if (accessToken) {
      setHasLoadedInitialEmails(false); // Reset to allow fresh load
      loadGmailMessages(accessToken, true); // Force refresh with toast
      setHasLoadedInitialEmails(true);
    } else {
      toast({
        title: "Not connected",
        description: "Please connect to Gmail first",
        variant: "destructive"
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded border">
          <p className="font-medium mb-1">📍 Setup Required:</p>
          <p>Using redirect URI: <code>{redirectUri}</code></p>
          <p className="mt-2">If authentication fails, add this redirect URI to your Google Cloud Console OAuth settings.</p>
        </div>
        
        {authError && (
          <div className="text-xs text-red-600 bg-red-50 p-3 rounded border">
            <p className="font-medium mb-1">❌ Authentication Error:</p>
            <p>{authError}</p>
          </div>
        )}
        
        <Button 
          onClick={() => setShowAuthDialog(true)} 
          className="w-full"
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect to Gmail'}
        </Button>
        
        <CompactAuthDialog
          isOpen={showAuthDialog}
          onClose={() => setShowAuthDialog(false)}
          title="Gmail"
          description="Authenticate with your Google account to access your Gmail"
          isConnecting={isConnecting}
          isConnected={isConnected}
          onConnect={handleGmailAuth}
          onDisconnect={handleDisconnect}
          error={authError}
          redirectUri={redirectUri}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-green-600">✓ Connected to Gmail</span>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh Emails'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </div>
      </div>

      <GmailSearchControls
        searchQuery={searchQuery}
        maxResults={maxResults}
        isLoading={isLoading}
        onSearchQueryChange={setSearchQuery}
        onMaxResultsChange={setMaxResults}
        onSearch={handleSearch}
      />

      <EmailList
        emails={emails}
        selectedEmails={selectedEmails}
        isLoading={isLoading}
        onEmailSelect={toggleEmailSelection}
      />

      {selectedEmails.length > 0 && (
        <EmailInvoiceProcessor
          selectedEmails={selectedEmails}
          accessToken={accessToken}
        />
      )}
    </div>
  );
};

export default GmailConnectorRefactored;
