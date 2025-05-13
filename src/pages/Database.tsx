
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Database as DatabaseIcon, Table, Server, RefreshCw, Settings, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/auth/UserAuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const Database = () => {
  const { user } = useAuth();
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [connectionType, setConnectionType] = useState("postgresql");
  const [hostname, setHostname] = useState("");
  const [port, setPort] = useState("");
  const [database, setDatabase] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [syncFrequency, setSyncFrequency] = useState("30");
  const [autoSync, setAutoSync] = useState(true);
  const [retentionDays, setRetentionDays] = useState("90");
  
  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hostname || !database || !username || !password) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setConnecting(true);
    
    // Simulate API connection
    setTimeout(() => {
      setConnecting(false);
      setShowConnectionDialog(false);
      toast.success(`Successfully connected to ${database} database`);
      
      // Reset form
      setHostname("");
      setPort("");
      setDatabase("");
      setUsername("");
      setPassword("");
    }, 1500);
  };

  const handleCompleteSetup = () => {
    toast.success("SAP HANA setup completed successfully");
  };

  // Role-based access control
  const canManageConnections = user?.role === 'admin' || user?.role === 'finance_analyst';
  const isReadOnly = user?.role === 'auditor';

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Database Connections</h1>
          {canManageConnections && (
            <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Connection
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Connect to Database</DialogTitle>
                  <DialogDescription>
                    Connect to your database to start synchronizing data
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleConnect} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="db-type">Database Type</Label>
                    <Select defaultValue={connectionType} onValueChange={setConnectionType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select database type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="postgresql">PostgreSQL</SelectItem>
                        <SelectItem value="mongodb">MongoDB</SelectItem>
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="oracle">Oracle</SelectItem>
                        <SelectItem value="saphana">SAP HANA</SelectItem>
                        <SelectItem value="zoho">Zoho CRM</SelectItem>
                        <SelectItem value="mssql">MS SQL Server</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hostname">Hostname</Label>
                      <Input 
                        id="hostname" 
                        placeholder="e.g., localhost or db.example.com" 
                        value={hostname}
                        onChange={(e) => setHostname(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="port">Port</Label>
                      <Input 
                        id="port" 
                        placeholder="e.g., 5432 for PostgreSQL" 
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="database">Database Name</Label>
                    <Input 
                      id="database" 
                      placeholder="Enter database name" 
                      value={database}
                      onChange={(e) => setDatabase(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input 
                        id="username" 
                        placeholder="Enter username" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <Tabs defaultValue="basic">
                    <TabsList className="mb-2">
                      <TabsTrigger value="basic">Basic</TabsTrigger>
                      <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="auto-sync">Auto Synchronization</Label>
                            <p className="text-sm text-muted-foreground">
                              Automatically sync database changes
                            </p>
                          </div>
                          <Switch
                            id="auto-sync"
                            checked={autoSync}
                            onCheckedChange={setAutoSync}
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="advanced">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Clock size={16} className="mr-2 text-muted-foreground" />
                            <Label htmlFor="sync-frequency">Synchronization Frequency (minutes)</Label>
                          </div>
                          <Input
                            id="sync-frequency"
                            type="number"
                            value={syncFrequency}
                            onChange={(e) => setSyncFrequency(e.target.value)}
                            min="5"
                            max="1440"
                          />
                          <p className="text-xs text-muted-foreground">
                            How often to check for database changes (minimum 5 minutes)
                          </p>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <AlertCircle size={16} className="mr-2 text-muted-foreground" />
                            <Label htmlFor="retention">Data Retention (days)</Label>
                          </div>
                          <Input
                            id="retention"
                            type="number"
                            value={retentionDays}
                            onChange={(e) => setRetentionDays(e.target.value)}
                            min="1"
                          />
                          <p className="text-xs text-muted-foreground">
                            How long to keep synchronized data in the system
                          </p>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <Label>Sync Options</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="sync-tables" defaultChecked />
                              <label
                                htmlFor="sync-tables"
                                className="text-sm leading-none"
                              >
                                Tables
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="sync-views" defaultChecked />
                              <label
                                htmlFor="sync-views"
                                className="text-sm leading-none"
                              >
                                Views
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="sync-procedures" />
                              <label
                                htmlFor="sync-procedures"
                                className="text-sm leading-none"
                              >
                                Stored Procedures
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="sync-functions" />
                              <label
                                htmlFor="sync-functions"
                                className="text-sm leading-none"
                              >
                                Functions
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" type="button" onClick={() => setShowConnectionDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={connecting}>
                      {connecting ? (
                        <>
                          <RefreshCw size={16} className="mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <DatabaseIcon className="h-5 w-5 text-blue-500" />
                <span className="rounded-full px-2 py-1 text-xs bg-green-100 text-green-800">Connected</span>
              </div>
              <CardTitle className="mt-2">ERP Database</CardTitle>
              <CardDescription>PostgreSQL • Production</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Tables:</span>
                  <span className="font-medium">42</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-green-600">Online</span>
                </div>
                <div className="flex justify-between">
                  <span>Last sync:</span>
                  <span>5 minutes ago</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1" disabled={isReadOnly}>
                  <Table className="mr-2 h-3.5 w-3.5" />
                  Browse
                </Button>
                <Button variant="outline" size="sm" className="flex-1" disabled={isReadOnly}>
                  <Server className="mr-2 h-3.5 w-3.5" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <DatabaseIcon className="h-5 w-5 text-orange-500" />
                <span className="rounded-full px-2 py-1 text-xs bg-orange-100 text-orange-800">Pending</span>
              </div>
              <CardTitle className="mt-2">SAP HANA</CardTitle>
              <CardDescription>SAP HANA • Integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Tables:</span>
                  <span className="font-medium">--</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-orange-600">Setup Pending</span>
                </div>
                <div className="flex justify-between">
                  <span>Last sync:</span>
                  <span>Never</span>
                </div>
              </div>
              {canManageConnections && (
                <Button variant="default" size="sm" className="w-full mt-4" onClick={handleCompleteSetup}>
                  Complete Setup
                </Button>
              )}
              {isReadOnly && (
                <Button variant="outline" size="sm" className="w-full mt-4" disabled>
                  Awaiting Setup (Read Only)
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-dashed flex items-center justify-center">
            <CardContent className="py-8 text-center">
              <div className="mx-auto rounded-full bg-background p-3 w-12 h-12 flex items-center justify-center">
                <PlusCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-3 font-medium">Add New Connection</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Connect to PostgreSQL, MongoDB, or other databases
              </p>
              {canManageConnections ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => setShowConnectionDialog(true)}
                >
                  New Connection
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4" 
                  disabled
                >
                  {isReadOnly ? "Read-Only Access" : "Insufficient Permissions"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Database;
