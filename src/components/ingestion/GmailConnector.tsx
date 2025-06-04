import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader, Check, Mail, Paperclip, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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

const GmailConnector = ({ onEmailsImported }: GmailConnectorProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<GmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxResults, setMaxResults] = useState('50');
  const [accessToken, setAccessToken] = useState<string>('');
  const { toast } = useToast();

  const CLIENT_ID = '59647658413-2aq8dou9iikfe6dq6ujsp1aiaku5r985.apps.googleusercontent.com';
  const REDIRECT_URI = `${window.location.protocol}//${window.location.host}/oauth/callback`;
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
      console.log('Redirect URI being used:', REDIRECT_URI);

      // Open popup for authentication
      const popup = window.open(
        authUrl.toString(),
        'gmail-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      }

      // Listen for messages from the popup
      const messageListener = async (event: MessageEvent) => {
        console.log('Received message from popup:', event);
        
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data?.type === 'OAUTH_SUCCESS' && event.data?.code) {
          console.log('Received auth code from popup:', event.data.code);
          window.removeEventListener('message', messageListener);
          popup.close();
          await exchangeCodeForToken(event.data.code);
        } else if (event.data?.type === 'OAUTH_ERROR') {
          console.error('OAuth error from popup:', event.data.error);
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
          setIsConnecting(false);
          
          toast({
            title: "Authentication cancelled",
            description: "Gmail authentication was cancelled",
            variant: "destructive"
          });
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(() => {
        if (popup && !popup.closed) {
          popup.close();
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsConnecting(false);
          toast({
            title: "Authentication timeout",
            description: "Gmail authentication timed out",
            variant: "destructive"
          });
        }
      }, 300000);

    } catch (error) {
      setIsConnecting(false);
      console.error('Gmail auth error:', error);
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to Gmail. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exchangeCodeForToken = async (authCode: string) => {
    try {
      console.log('Exchanging auth code for token...');
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: { 
          authCode, 
          scope: SCOPE,
          redirectUri: REDIRECT_URI
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Token exchange response:', data);

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
      console.error('Token exchange error:', error);
      setIsConnecting(false);
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
      // Import email data and attachments
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

  const searchEmails = async () => {
    if (accessToken) {
      await loadGmailMessages(accessToken);
    }
  };

  if (!isConnected) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Connect to Gmail</h3>
            <p className="text-sm text-muted-foreground">
              Authenticate with your Google account to access your Gmail
            </p>
            <p className="text-xs text-muted-foreground">
              Note: You may see a warning that the app is unverified. Click "Advanced" → "Go to {window.location.hostname} (unsafe)" to continue.
            </p>
          </div>
          
          <Button
            onClick={handleGmailAuth}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Connecting to Gmail...
              </>
            ) : (
              'Connect Gmail'
            )}
          </Button>
          
          <div className="text-xs text-muted-foreground">
            <p>You'll be redirected to Google to authorize access</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-sm">Connected to Gmail</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsConnected(false);
            setEmails([]);
            setSelectedEmails([]);
            setAccessToken('');
          }}
        >
          Disconnect
        </Button>
      </div>

      <div className="flex space-x-2">
        <div className="flex-1">
          <Input
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchEmails()}
          />
        </div>
        <div className="w-20">
          <Input
            type="number"
            placeholder="50"
            value={maxResults}
            onChange={(e) => setMaxResults(e.target.value)}
            min="1"
            max="500"
          />
        </div>
        <Button variant="outline" onClick={searchEmails} disabled={isLoading}>
          Search
        </Button>
      </div>

      <Card className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <Loader className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading emails...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No emails found
          </div>
        ) : (
          <div className="divide-y">
            {emails.map((email) => (
              <div
                key={email.id}
                className="p-3 hover:bg-muted/40 cursor-pointer"
                onClick={() => toggleEmailSelection(email)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium truncate">
                        {email.subject}
                      </span>
                      {email.hasAttachments && (
                        <Paperclip className="h-3 w-3 text-gray-500" />
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-1">
                      From: {email.from} • {new Date(email.date).toLocaleDateString()}
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-2 truncate">
                      {email.snippet}
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {email.labels.map((label) => (
                        <Badge key={label} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex h-4 w-4 rounded border border-primary ml-2">
                    {selectedEmails.some(e => e.id === email.id) && (
                      <Check className="h-3 w-3 text-primary" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => loadGmailMessages(accessToken)}
          disabled={isLoading}
          size="sm"
        >
          Refresh
        </Button>
        
        <Button
          onClick={importSelectedEmails}
          disabled={isLoading || selectedEmails.length === 0}
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader className="h-4 w-4 mr-1 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-1" />
              Import {selectedEmails.length} email(s)
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default GmailConnector;
