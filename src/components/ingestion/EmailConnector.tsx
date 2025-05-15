
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MailCheck, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EmailConnector: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState('');
  const [port, setPort] = useState('993');
  const [ssl, setSsl] = useState(true);
  const [folderPath, setFolderPath] = useState('INBOX');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [emails, setEmails] = useState<Array<{id: string, subject: string, date: string, hasAttachments: boolean}>>([]);
  const { toast } = useToast();

  // Mock data for demonstration
  const mockEmails = [
    {id: '1', subject: 'Monthly Invoice - June 2024', date: '2024-06-10', hasAttachments: true},
    {id: '2', subject: 'Expense Report Q2', date: '2024-06-08', hasAttachments: true},
    {id: '3', subject: 'Payment Confirmation #1234', date: '2024-06-05', hasAttachments: false},
    {id: '4', subject: 'Financial Statement - May 2024', date: '2024-06-01', hasAttachments: true},
  ];

  const handleConnect = () => {
    if (!email || !password || !server) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    // Simulate connection process
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setEmails(mockEmails);
      toast({
        title: "Connection successful",
        description: "Successfully connected to email server",
      });
    }, 2000);
  };

  const handleRefresh = () => {
    setIsConnecting(true);
    
    // Simulate refresh
    setTimeout(() => {
      setIsConnecting(false);
      toast({
        title: "Emails refreshed",
        description: "Email list has been updated",
      });
    }, 1500);
  };

  const handleImportEmail = (id: string) => {
    toast({
      title: "Email imported",
      description: `Email and attachments have been imported`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col mb-6">
        <h1 className="text-3xl font-semibold">Email Connector</h1>
        <p className="text-muted-foreground mt-1">
          Connect to your email to import documents and data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Email Server Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="your.email@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isConnected}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="•••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isConnected}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="server">IMAP Server</Label>
              <Input 
                id="server" 
                placeholder="imap.example.com" 
                value={server}
                onChange={(e) => setServer(e.target.value)}
                disabled={isConnected}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input 
                id="port" 
                placeholder="993" 
                value={port}
                onChange={(e) => setPort(e.target.value)}
                disabled={isConnected}
              />
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <Checkbox 
                id="ssl" 
                checked={ssl} 
                onCheckedChange={() => setSsl(!ssl)}
                disabled={isConnected}
              />
              <label 
                htmlFor="ssl" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Use SSL
              </label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="folderPath">Folder Path</Label>
              <Input 
                id="folderPath" 
                placeholder="INBOX" 
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                disabled={isConnected}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {isConnected ? (
            <div className="flex space-x-4 w-full">
              <Button 
                variant="outline" 
                onClick={() => setIsConnected(false)}
                className="flex-1"
              >
                Disconnect
              </Button>
              <Button 
                onClick={handleRefresh} 
                disabled={isConnecting}
                className="flex-1"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh Emails
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting} 
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...
                </>
              ) : (
                <>
                  <MailCheck className="mr-2 h-4 w-4" /> Connect to Email
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Email list */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Available Emails</CardTitle>
          </CardHeader>
          <CardContent>
            {emails.length > 0 ? (
              <div className="divide-y">
                {emails.map((email) => (
                  <div key={email.id} className="py-4 flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="font-medium">{email.subject}</p>
                      <div className="flex space-x-4 text-sm text-muted-foreground">
                        <span>Date: {email.date}</span>
                        {email.hasAttachments && (
                          <span className="text-blue-500">Has attachments</span>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleImportEmail(email.id)}
                    >
                      Import
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertDescription>No emails found matching your criteria.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmailConnector;
