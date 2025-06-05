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
  const { toast } = useToast();

  // Configure auth service
  const authService = new GoogleAuthService({
    clientId: '59647658413-2aq8dou9iikfe6dq6ujsp1aiaku5r985.apps.googleusercontent.com',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    redirectUri: `${window.location.origin}/oauth/callback`
  }, 'gmail_auth_tokens');

  // Check for stored tokens on mount
  React.useEffect(() => {
    if (authService.hasValidTokens()) {
      const tokens = authService.getStoredTokens();
      if (tokens.accessToken) {
        setAccessToken(tokens.accessToken);
        setIsConnected(true);
        loadGmailMessages(tokens.accessToken);
      }
    }
  }, []);

  const handleGmailAuth = async () => {
    setIsConnecting(true);
    setAuthError('');

    try {
      const result = await authService.authenticateWithPopup();
      
      if (result.success && result.accessToken) {
        setAccessToken(result.accessToken);
        setIsConnected(true);
        setShowAuthDialog(false);
        await loadGmailMessages(result.accessToken);
        
        toast({
          title: "Connected to Gmail",
          description: "Successfully authenticated with your Gmail account"
        });
      } else {
        setAuthError(result.error || 'Authentication failed');
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    authService.clearTokens();
    setIsConnected(false);
    setEmails([]);
    setSelectedEmails([]);
    setAccessToken('');
    setShowAuthDialog(false);
    
    toast({
      title: "Disconnected",
      description: "Gmail connection has been removed"
    });
  };

  const loadGmailMessages = async (token: string) => {
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

      if (error) throw error;

      if (data.success) {
        setEmails(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error loading emails",
        description: "Failed to load emails from Gmail",
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
        <Button variant="outline" size="sm" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>

      <GmailSearchControls
        searchQuery={searchQuery}
        maxResults={maxResults}
        isLoading={isLoading}
        onSearchQueryChange={setSearchQuery}
        onMaxResultsChange={setMaxResults}
        onSearch={() => loadGmailMessages(accessToken)}
      />

      <EmailList
        emails={emails}
        selectedEmails={selectedEmails}
        isLoading={isLoading}
        onEmailSelect={toggleEmailSelection}
      />

      <Button
        variant="outline"
        onClick={() => loadGmailMessages(accessToken)}
        disabled={isLoading}
        size="sm"
      >
        Refresh
      </Button>

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
