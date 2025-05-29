
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader, Check, Mail, Paperclip, Download } from 'lucide-react';

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
  const { toast } = useToast();

  const handleGmailAuth = async () => {
    setIsConnecting(true);
    try {
      // This would normally use Google OAuth2 flow for Gmail API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsConnected(true);
      await loadGmailMessages();
      
      toast({
        title: "Connected to Gmail",
        description: "Successfully authenticated with your Gmail account"
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Failed to connect to Gmail. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const loadGmailMessages = async () => {
    setIsLoading(true);
    try {
      // Simulate Gmail API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockEmails: GmailMessage[] = [
        {
          id: '1',
          subject: 'Invoice #12345 - Payment Due',
          from: 'billing@company.com',
          date: '2024-01-20T10:30:00Z',
          snippet: 'Please find attached your invoice for services rendered...',
          hasAttachments: true,
          labels: ['INBOX', 'IMPORTANT']
        },
        {
          id: '2',
          subject: 'Monthly Financial Report',
          from: 'finance@organization.com',
          date: '2024-01-19T15:45:00Z',
          snippet: 'Attached is the monthly financial report for review...',
          hasAttachments: true,
          labels: ['INBOX']
        },
        {
          id: '3',
          subject: 'Contract Renewal Notice',
          from: 'legal@partner.com',
          date: '2024-01-18T09:15:00Z',
          snippet: 'Your contract is due for renewal. Please review the attached documents...',
          hasAttachments: true,
          labels: ['INBOX', 'CATEGORY_UPDATES']
        },
        {
          id: '4',
          subject: 'Receipt for Purchase Order #67890',
          from: 'orders@supplier.com',
          date: '2024-01-17T14:20:00Z',
          snippet: 'Thank you for your purchase. Receipt attached...',
          hasAttachments: true,
          labels: ['INBOX']
        }
      ];
      
      setEmails(mockEmails);
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
      // Simulate email import process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
    if (!searchQuery.trim()) {
      await loadGmailMessages();
      return;
    }

    setIsLoading(true);
    try {
      // Simulate search
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const filteredEmails = emails.filter(email =>
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.snippet.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setEmails(filteredEmails);
      
      toast({
        title: "Search completed",
        description: `Found ${filteredEmails.length} emails matching "${searchQuery}"`
      });
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Failed to search emails",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
          onClick={loadGmailMessages}
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
