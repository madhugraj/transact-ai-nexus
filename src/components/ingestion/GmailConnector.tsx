import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, Loader, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import GmailAuth from './gmail/GmailAuth';
import GmailSearchControls from './gmail/GmailSearchControls';
import EmailList from './gmail/EmailList';
import EmailInvoiceProcessor from './EmailInvoiceProcessor';
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
const GmailConnector = ({
  onEmailsImported
}: GmailConnectorProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<GmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxResults, setMaxResults] = useState('50');
  const [accessToken, setAccessToken] = useState<string>('');
  const {
    toast
  } = useToast();
  const CLIENT_ID = '59647658413-2aq8dou9iikfe6dq6ujsp1aiaku5r985.apps.googleusercontent.com';

  // Use your pre-configured redirect URI based on the current domain
  const getRedirectUri = () => {
    const currentHost = window.location.host;
    console.log('Current host:', currentHost);
    if (currentHost.includes('lovable.app')) {
      return 'https://transact-ai-nexus.lovable.app/oauth/callback';
    } else if (currentHost.includes('lovableproject.com')) {
      return 'https://79d72649-d878-4ff4-9672-26026a4d9011.lovableproject.com/oauth/callback';
    }
    // Fallback to the main production URL
    return 'https://transact-ai-nexus.lovable.app/oauth/callback';
  };
  const REDIRECT_URI = getRedirectUri();
  const SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
  const handleGmailAuth = async () => {
    setIsConnecting(true);
    try {
      // Create OAuth URL for Gmail
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', SCOPE);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', 'gmail_auth');
      console.log('Opening Gmail auth popup with URL:', authUrl.toString());
      console.log('Using redirect URI:', REDIRECT_URI);

      // Open popup for authentication
      const popup = window.open(authUrl.toString(), 'gmail-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');
      if (!popup) {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      }

      // Listen for messages from the popup
      const messageListener = async (event: MessageEvent) => {
        console.log('Received message:', event.data);
        if (event.origin !== window.location.origin) {
          console.log('Message from different origin, ignoring');
          return;
        }
        if (event.data?.type === 'OAUTH_SUCCESS' && event.data?.code) {
          console.log('OAuth success received');
          window.removeEventListener('message', messageListener);
          popup.close();
          await exchangeCodeForToken(event.data.code);
        } else if (event.data?.type === 'OAUTH_ERROR') {
          console.log('OAuth error received:', event.data.error);
          window.removeEventListener('message', messageListener);
          popup.close();
          setIsConnecting(false);
          toast({
            title: "Authentication failed",
            description: event.data.error || "Gmail authentication failed",
            variant: "destructive"
          });
        }
      };
      window.addEventListener('message', messageListener);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          console.log('Popup was closed manually');
          setIsConnecting(false);
        }
      }, 1000);
    } catch (error) {
      setIsConnecting(false);
      console.error('Gmail auth error:', error);
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to Gmail",
        variant: "destructive"
      });
    }
  };
  const exchangeCodeForToken = async (authCode: string) => {
    console.log('Exchanging code for token...');
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('google-auth', {
        body: {
          authCode,
          scope: SCOPE,
          redirectUri: REDIRECT_URI
        }
      });
      if (error) throw error;
      if (data.success) {
        setAccessToken(data.accessToken);
        setIsConnected(true);
        await loadGmailMessages(data.accessToken);
        toast({
          title: "Connected to Gmail",
          description: "Successfully authenticated with your Gmail account"
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setIsConnecting(false);
      console.error('Token exchange error:', error);
      toast({
        title: "Token exchange failed",
        description: "Failed to complete Gmail authentication",
        variant: "destructive"
      });
    }
  };
  const loadGmailMessages = async (token: string) => {
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('gmail', {
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
  const importSelectedEmails = async () => {
    if (selectedEmails.length === 0) {
      toast({
        title: "No emails selected",
        description: "Please select emails to import"
      });
      return;
    }
    setIsLoading(true);
    try {
      if (onEmailsImported) {
        onEmailsImported(selectedEmails);
      }
      toast({
        title: "Emails imported",
        description: `Successfully imported ${selectedEmails.length} emails and their attachments`
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to import emails from Gmail",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  if (!isConnected) {
    return <GmailAuth isConnecting={isConnecting} onAuth={handleGmailAuth} />;
  }
  return <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-sm">Connected to Gmail</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
        setIsConnected(false);
        setEmails([]);
        setSelectedEmails([]);
        setAccessToken('');
      }}>
          Disconnect
        </Button>
      </div>

      <GmailSearchControls searchQuery={searchQuery} maxResults={maxResults} isLoading={isLoading} onSearchQueryChange={setSearchQuery} onMaxResultsChange={setMaxResults} onSearch={() => loadGmailMessages(accessToken)} />

      <EmailList emails={emails} selectedEmails={selectedEmails} isLoading={isLoading} onEmailSelect={toggleEmailSelection} />

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => loadGmailMessages(accessToken)} disabled={isLoading} size="sm">
          Refresh
        </Button>
        
        
      </div>

      {selectedEmails.length > 0 && <EmailInvoiceProcessor selectedEmails={selectedEmails} accessToken={accessToken} />}
    </div>;
};
export default GmailConnector;