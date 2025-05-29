import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GmailConnector from './GmailConnector';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MailCheck, Loader2, RefreshCw, Database, Clock, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
  
  // Advanced sync settings
  const [syncFrequency, setSyncFrequency] = useState('30');
  const [syncMode, setSyncMode] = useState('incremental');
  const [enableAutoSync, setEnableAutoSync] = useState(false);
  const [retentionDays, setRetentionDays] = useState('90');
  const [syncAttachments, setSyncAttachments] = useState(true);
  const [activeTab, setActiveTab] = useState('connection');
  
  // Database sync settings
  const [syncToDatabase, setSyncToDatabase] = useState(false);
  const [dbConnection, setDbConnection] = useState('');
  const [targetTable, setTargetTable] = useState('emails');
  const [importOptions, setImportOptions] = useState<string[]>(['metadata']);

  // Mock data for demonstration
  const mockEmails = [
    {id: '1', subject: 'Monthly Invoice - June 2024', date: '2024-06-10', hasAttachments: true},
    {id: '2', subject: 'Expense Report Q2', date: '2024-06-08', hasAttachments: true},
    {id: '3', subject: 'Payment Confirmation #1234', date: '2024-06-05', hasAttachments: false},
    {id: '4', subject: 'Financial Statement - May 2024', date: '2024-06-01', hasAttachments: true},
  ];

  const mockDbConnections = [
    {id: 'postgres1', name: 'PostgreSQL - Analytics'},
    {id: 'mysql1', name: 'MySQL - Finance'},
    {id: 'saphana1', name: 'SAP HANA - Enterprise'}
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

  const handleSaveSyncSettings = () => {
    toast({
      title: "Sync settings saved",
      description: `Email synchronization settings have been updated`,
    });
  };

  const handleSaveDbSettings = () => {
    toast({
      title: "Database settings saved",
      description: `Database synchronization settings have been updated`,
    });
  };

  const handleStartSync = () => {
    setIsConnecting(true);
    
    // Simulate sync process
    setTimeout(() => {
      setIsConnecting(false);
      toast({
        title: "Sync completed",
        description: `Email data has been synchronized ${syncToDatabase ? 'to database ' + dbConnection : ''}`,
      });
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col mb-6">
        <h1 className="text-3xl font-semibold">Email Connector</h1>
        <p className="text-muted-foreground mt-1">
          Connect to your email to import documents and data
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="gmail">Gmail</TabsTrigger>
          <TabsTrigger value="connection">IMAP/POP3</TabsTrigger>
          <TabsTrigger value="sync">Sync Options</TabsTrigger>
          <TabsTrigger value="database">Database Integration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="gmail">
          <GmailConnector onEmailsImported={(emails) => {
            console.log('Gmail emails imported:', emails);
            toast({
              title: "Gmail emails imported",
              description: `Successfully imported ${emails.length} emails from Gmail`
            });
          }} />
        </TabsContent>
        
        {/* Connection Tab */}
        <TabsContent value="connection">
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
            <Card className="mt-6">
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
        </TabsContent>
        
        {/* Sync Options Tab */}
        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Email Synchronization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Enable Auto-Sync</Label>
                  <p className="text-sm text-muted-foreground">Automatically sync emails based on schedule</p>
                </div>
                <Switch 
                  checked={enableAutoSync}
                  onCheckedChange={setEnableAutoSync}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2 text-muted-foreground" />
                    <Label htmlFor="sync-frequency">Sync Frequency (minutes)</Label>
                  </div>
                  <Input
                    id="sync-frequency"
                    type="number"
                    value={syncFrequency}
                    onChange={(e) => setSyncFrequency(e.target.value)}
                    min="5"
                    disabled={!enableAutoSync}
                  />
                  <p className="text-xs text-muted-foreground">
                    How often to check for new emails (minimum 5 minutes)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Sync Mode</Label>
                  <RadioGroup value={syncMode} onValueChange={setSyncMode}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="incremental" id="sync-incremental" disabled={!enableAutoSync} />
                      <Label htmlFor="sync-incremental">Incremental (Only new emails)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="full" id="sync-full" disabled={!enableAutoSync} />
                      <Label htmlFor="sync-full">Full (All emails in folder)</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="retention">Data Retention (days)</Label>
                  <Input
                    id="retention"
                    type="number"
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(e.target.value)}
                    min="1"
                    disabled={!enableAutoSync}
                  />
                  <p className="text-xs text-muted-foreground">
                    How long to keep synchronized emails (0 for indefinite)
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="sync-attachments" 
                    checked={syncAttachments}
                    onCheckedChange={(checked) => setSyncAttachments(checked as boolean)}
                    disabled={!enableAutoSync}
                  />
                  <Label htmlFor="sync-attachments">Sync email attachments</Label>
                </div>
                
                <div className="space-y-2">
                  <Label>Filter Emails</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="from-filter" className="text-sm">From</Label>
                      <Input id="from-filter" placeholder="sender@example.com" disabled={!enableAutoSync} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject-filter" className="text-sm">Subject Contains</Label>
                      <Input id="subject-filter" placeholder="invoice, report" disabled={!enableAutoSync} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date-after" className="text-sm">Date After</Label>
                      <Input id="date-after" type="date" disabled={!enableAutoSync} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="has-attachments" className="text-sm">Has Attachments</Label>
                      <Select disabled={!enableAutoSync} defaultValue="any">
                        <SelectTrigger>
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex flex-col sm:flex-row w-full space-y-2 sm:space-y-0 sm:space-x-2">
                <Button 
                  variant="outline"
                  onClick={handleStartSync}
                  disabled={isConnecting || !isConnected}
                  className="flex-1"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" /> Run Sync Now
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSaveSyncSettings}
                  className="flex-1"
                >
                  <Settings className="mr-2 h-4 w-4" /> Save Sync Settings
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Database Integration Tab */}
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Database Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Enable Database Sync</Label>
                  <p className="text-sm text-muted-foreground">Sync emails to a database connection</p>
                </div>
                <Switch 
                  checked={syncToDatabase}
                  onCheckedChange={setSyncToDatabase}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Database Connection</Label>
                  <Select 
                    disabled={!syncToDatabase} 
                    value={dbConnection}
                    onValueChange={setDbConnection}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a database connection" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockDbConnections.map(conn => (
                        <SelectItem key={conn.id} value={conn.id}>{conn.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select a database connection to sync email data to
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="target-table">Target Table/Collection</Label>
                  <Input
                    id="target-table"
                    value={targetTable}
                    onChange={(e) => setTargetTable(e.target.value)}
                    placeholder="emails"
                    disabled={!syncToDatabase || !dbConnection}
                  />
                  <p className="text-xs text-muted-foreground">
                    Table or collection to store email data
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Import Options</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="import-metadata" 
                        checked={importOptions.includes('metadata')}
                        onCheckedChange={(checked) => {
                          const newOptions = [...importOptions];
                          if (checked) {
                            if (!newOptions.includes('metadata')) newOptions.push('metadata');
                          } else {
                            const idx = newOptions.indexOf('metadata');
                            if (idx >= 0) newOptions.splice(idx, 1);
                          }
                          setImportOptions(newOptions);
                        }}
                        disabled={!syncToDatabase || !dbConnection}
                      />
                      <Label htmlFor="import-metadata">Email Metadata</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="import-body" 
                        checked={importOptions.includes('body')}
                        onCheckedChange={(checked) => {
                          const newOptions = [...importOptions];
                          if (checked) {
                            if (!newOptions.includes('body')) newOptions.push('body');
                          } else {
                            const idx = newOptions.indexOf('body');
                            if (idx >= 0) newOptions.splice(idx, 1);
                          }
                          setImportOptions(newOptions);
                        }}
                        disabled={!syncToDatabase || !dbConnection}
                      />
                      <Label htmlFor="import-body">Email Body</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="import-attachments" 
                        checked={importOptions.includes('attachments')}
                        onCheckedChange={(checked) => {
                          const newOptions = [...importOptions];
                          if (checked) {
                            if (!newOptions.includes('attachments')) newOptions.push('attachments');
                          } else {
                            const idx = newOptions.indexOf('attachments');
                            if (idx >= 0) newOptions.splice(idx, 1);
                          }
                          setImportOptions(newOptions);
                        }}
                        disabled={!syncToDatabase || !dbConnection}
                      />
                      <Label htmlFor="import-attachments">Attachments</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="import-headers" 
                        checked={importOptions.includes('headers')}
                        onCheckedChange={(checked) => {
                          const newOptions = [...importOptions];
                          if (checked) {
                            if (!newOptions.includes('headers')) newOptions.push('headers');
                          } else {
                            const idx = newOptions.indexOf('headers');
                            if (idx >= 0) newOptions.splice(idx, 1);
                          }
                          setImportOptions(newOptions);
                        }}
                        disabled={!syncToDatabase || !dbConnection}
                      />
                      <Label htmlFor="import-headers">Email Headers</Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Schema Management</Label>
                  <RadioGroup defaultValue="auto" disabled={!syncToDatabase || !dbConnection}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="auto" id="schema-auto" />
                      <Label htmlFor="schema-auto">Auto-create schema if needed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="use-existing" id="schema-existing" />
                      <Label htmlFor="schema-existing">Use existing schema</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex w-full space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab('sync')}
                  className="flex-1"
                >
                  Back to Sync Options
                </Button>
                <Button
                  onClick={handleSaveDbSettings}
                  disabled={!syncToDatabase || !dbConnection}
                  className="flex-1"
                >
                  <Database className="mr-2 h-4 w-4" /> Save Database Settings
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailConnector;
