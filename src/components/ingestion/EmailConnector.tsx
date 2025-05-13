
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, MailCheck, MailX, RefreshCw, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const EmailConnector = () => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [autoTagging, setAutoTagging] = useState(true);
  const { toast } = useToast();
  
  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    setConnecting(true);
    
    // Simulate API connection
    setTimeout(() => {
      setConnected(true);
      setConnecting(false);
      toast({
        title: "Success",
        description: "Email account connected successfully",
      });
    }, 1500);
  };
  
  const handleDisconnect = () => {
    setConnected(false);
    setEmail('');
    setPassword('');
    toast({
      title: "Disconnected",
      description: "Email account has been disconnected",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Email Connector</h1>
        <p className="text-muted-foreground">
          Connect your email account to automatically ingest invoices, receipts, and other financial documents.
        </p>
      </div>
      
      <Tabs defaultValue="gmail" className="w-full">
        <TabsList>
          <TabsTrigger value="gmail">Gmail</TabsTrigger>
          <TabsTrigger value="outlook">Outlook</TabsTrigger>
          <TabsTrigger value="imap">IMAP/SMTP</TabsTrigger>
        </TabsList>
        
        <div className="pt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Gmail Connection</CardTitle>
                  <CardDescription>
                    Connect to your Gmail account to start ingestion
                  </CardDescription>
                </div>
                {connected && (
                  <Badge variant="outline" className="bg-status-approved/20 text-status-approved">
                    <MailCheck size={14} className="mr-1" />
                    Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!connected ? (
                <form onSubmit={handleConnect} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      placeholder="your.email@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password or App Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      For Gmail, use an App Password. <a href="https://support.google.com/accounts/answer/185833" target="_blank" className="text-primary hover:underline">Learn more</a>
                    </p>
                  </div>
                  <Button type="submit" disabled={connecting}>
                    {connecting ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Mail size={16} className="mr-2" />
                        Connect Email
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-lg bg-secondary p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{email}</p>
                          <p className="text-sm text-muted-foreground">
                            Last sync: 5 minutes ago
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="icon">
                        <RefreshCw size={16} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="auto-tagging">Auto-tagging documents</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically classify incoming emails as invoices, receipts, etc.
                          </p>
                        </div>
                        <Switch
                          id="auto-tagging"
                          checked={autoTagging}
                          onCheckedChange={setAutoTagging}
                        />
                      </div>
                      
                      <div>
                        <Label className="mb-2 block">Document types to ingest</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="invoices" defaultChecked />
                            <label
                              htmlFor="invoices"
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Invoices
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="receipts" defaultChecked />
                            <label
                              htmlFor="receipts"
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Receipts
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="purchase-orders" defaultChecked />
                            <label
                              htmlFor="purchase-orders"
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Purchase Orders
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="payment-advice" defaultChecked />
                            <label
                              htmlFor="payment-advice"
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Payment Advice
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => {}}>
                        <Settings size={16} className="mr-2" />
                        Advanced Settings
                      </Button>
                      <Button variant="destructive" onClick={handleDisconnect}>
                        <MailX size={16} className="mr-2" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>
      
      <div className="pt-4">
        <Card className={cn(
          "border-dashed",
          connected && "bg-muted"
        )}>
          <CardHeader>
            <CardTitle>Recent Email Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {connected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">invoice_may2023.pdf</p>
                    <p className="text-sm text-muted-foreground">From: vendor@example.com</p>
                  </div>
                  <Badge>Invoice</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">receipt_office_supplies.pdf</p>
                    <p className="text-sm text-muted-foreground">From: sales@officemart.com</p>
                  </div>
                  <Badge>Receipt</Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">po_tech_equipment.xlsx</p>
                    <p className="text-sm text-muted-foreground">From: orders@techsupplier.com</p>
                  </div>
                  <Badge>Purchase Order</Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="mx-auto h-10 w-10 mb-3 text-muted-foreground/70" />
                <p>Connect your email to see recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailConnector;
