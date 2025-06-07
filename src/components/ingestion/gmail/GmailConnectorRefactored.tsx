
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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

  // Use DYNAMIC redirect URI as specified
  const authService = new GoogleAuthService({
    clientId: '59647658413-2aq8dou9iikfe6dq6ujsp1aiaku5r985.apps.googleusercontent.com',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    redirectUri: `${window.location.origin}/oauth/callback` // Dynamic based on current domain
  }, 'gmail_auth_tokens');

  // Check for stored tokens on mount and maintain connection
  React.useEffect(() => {
    console.log('Gmail connector mounted, checking for stored tokens...');
    
    const checkStoredAuth = () => {
      if (authService.hasValidTokens()) {
        const tokens = authService.getStoredTokens();
        if (tokens.accessToken) {
          console.log('Found stored tokens, setting connected state');
          setAccessToken(tokens.accessToken);
          setIsConnected(true);
          
          // Only load emails if we haven't loaded them yet
          if (!hasLoadedInitialEmails) {
            loadGmailMessages(tokens.accessToken);
            setHasLoadedInitialEmails(true);
          }
        }
      }
    };

    checkStoredAuth();
  }, [hasLoadedInitialEmails]);

  const handleGmailAuth = async () => {
    console.log('Starting Gmail authentication...');
    setIsConnecting(true);
    setAuthError('');

    try {
      const result = await authService.authenticateWithPopup();
      console.log('Authentication result:', result);
      
      if (result.success && result.accessToken) {
        setAccessToken(result.accessToken);
        setIsConnected(true);
        setShowAuthDialog(false);
        setHasLoadedInitialEmails(false); // Reset to allow loading
        await loadGmailMessages(result.accessToken);
        setHasLoadedInitialEmails(true);
        
        toast({
          title: "Connected to Gmail",
          description: "Successfully authenticated with your Gmail account"
        });
      } else {
        console.error('Authentication failed:', result.error);
        setAuthError(result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
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

  const loadGmailMessages = async (token: string, forceRefresh: boolean = false) => {
    console.log('Loading Gmail messages...', forceRefresh ? '(forced refresh)' : '');
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gmail', {
        body: {
          accessToken: token,
          action: 'list',
          query: searchQuery,
          maxResults: parseInt(maxResults)
        }
      });

      if (error) {
        console.error('Gmail API error:', error);
        if (error.message && error.message.includes('invalid_grant')) {
          authService.clearTokens();
          setIsConnected(false);
          setAccessToken('');
          setHasLoadedInitialEmails(false);
          throw new Error('Session expired. Please reconnect to Gmail.');
        }
        throw error;
      }

      console.log('Gmail messages loaded:', data);
      if (data.success) {
        setEmails(data.data);
        console.log(`Successfully loaded ${data.data.length} emails`);
        
        if (forceRefresh) {
          toast({
            title: "Emails refreshed",
            description: `Loaded ${data.data.length} emails from Gmail`
          });
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error loading emails:', error);
      toast({
        title: "Error loading emails",
        description: error instanceof Error ? error.message : "Failed to load emails from Gmail",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
      <>
        <Button onClick={() => setShowAuthDialog(true)} className="w-full">
          Connect to Gmail
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
        />
      </>
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
