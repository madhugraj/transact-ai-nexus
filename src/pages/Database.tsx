
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Database as DatabaseIcon, Table, Server, RefreshCw, Settings, Clock, AlertCircle, Activity, Shield, Calendar, FileCode, Cpu, Copy, FilePlus, BarChart, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/UserAuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const Database = () => {
  const { user } = useAuth();
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showSyncSettingsDialog, setShowSyncSettingsDialog] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [advancedSyncConfig, setAdvancedSyncConfig] = useState({
    incrementalSync: true,
    deltaTracking: true,
    compressionEnabled: false,
    parallelQueries: 2,
    maxBatchSize: 5000,
    errorRetries: 3,
    logLevel: "error",
    notifyOnFailure: true,
    notifyOnSuccess: false,
    backupBeforeSync: true
  });
  
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

  const startDatabaseSync = (dbName: string) => {
    setSelectedDatabase(dbName);
    setIsSyncing(true);
    setSyncProgress(0);
    
    // Simulate sync progress
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          toast.success(`${dbName} sync completed successfully`);
          return 0;
        }
        return prev + 10;
      });
    }, 400);
  };

  const openSyncSettings = (dbName: string) => {
    setSelectedDatabase(dbName);
    setShowSyncSettingsDialog(true);
  };

  const saveSyncSettings = () => {
    toast.success(`Sync settings for ${selectedDatabase} saved successfully`);
    setShowSyncSettingsDialog(false);
  };

  // Database-specific sync options based on type
  const renderDatabaseSpecificOptions = (type: string) => {
    switch (type) {
      case "postgresql":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>PostgreSQL Specific Options</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="pg-listen-notify" defaultChecked />
                  <label htmlFor="pg-listen-notify" className="text-sm">Enable LISTEN/NOTIFY</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="pg-use-copy" defaultChecked />
                  <label htmlFor="pg-use-copy" className="text-sm">Use COPY for bulk operations</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="pg-track-ddl" />
                  <label htmlFor="pg-track-ddl" className="text-sm">Track schema changes</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="pg-use-prepared" defaultChecked />
                  <label htmlFor="pg-use-prepared" className="text-sm">Use prepared statements</label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Publication Settings</Label>
              <Input placeholder="publication_name" defaultValue="app_publication" />
              <p className="text-xs text-muted-foreground">
                Name of the PostgreSQL publication to subscribe to for changes
              </p>
            </div>
          </div>
        );
      case "saphana":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>SAP HANA Specific Options</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="sap-delta-capture" defaultChecked />
                  <label htmlFor="sap-delta-capture" className="text-sm">Use delta capture</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="sap-cdc" />
                  <label htmlFor="sap-cdc" className="text-sm">CDC integration</label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>RFC Connection</Label>
              <Input placeholder="RFC connection name" defaultValue="" />
              <p className="text-xs text-muted-foreground">
                Optional RFC connection for real-time data access
              </p>
            </div>
          </div>
        );
      default:
        return (
          <p className="text-sm text-muted-foreground">
            Configure sync settings specific to your database type
          </p>
        );
    }
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

        {/* Sync progress indicator */}
        {isSyncing && (
          <Card className="mb-4">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Synchronizing {selectedDatabase} database</span>
                </div>
                <Badge variant="outline">{syncProgress}%</Badge>
              </div>
              <Progress value={syncProgress} className="h-1" />
            </CardContent>
          </Card>
        )}

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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1" 
                  onClick={() => openSyncSettings("ERP Database")}
                  disabled={isReadOnly}
                >
                  <Settings className="mr-2 h-3.5 w-3.5" />
                  Settings
                </Button>
              </div>
              {canManageConnections && (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => startDatabaseSync("ERP Database")}
                  disabled={isSyncing}
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Sync Now
                </Button>
              )}
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

      {/* Database Synchronization Settings Dialog */}
      <Dialog open={showSyncSettingsDialog} onOpenChange={setShowSyncSettingsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Synchronization Settings - {selectedDatabase}</DialogTitle>
            <DialogDescription>
              Configure how data is synchronized between systems
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-5 py-4">
              <Tabs defaultValue="general">
                <TabsList className="mb-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="specific">DB Specific</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="space-y-4">
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
                  
                  <div className="space-y-2">
                    <Label>Data Objects</Label>
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
                </TabsContent>
                
                <TabsContent value="schedule" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Sync Schedule Type</Label>
                    <Select defaultValue="interval">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="interval">Regular Interval</SelectItem>
                        <SelectItem value="cron">Cron Schedule</SelectItem>
                        <SelectItem value="once">One-time Sync</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Choose how you want to schedule synchronization
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-2 text-muted-foreground" />
                      <Label>Time Window</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Start Time</Label>
                        <Input type="time" defaultValue="00:00" />
                      </div>
                      <div>
                        <Label className="text-xs">End Time</Label>
                        <Input type="time" defaultValue="23:59" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Only run synchronization during these hours
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Active Days</Label>
                    <div className="flex flex-wrap gap-2">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                        <div 
                          key={i}
                          className="w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer hover:bg-primary/10 text-sm"
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Incremental Sync</Label>
                          <p className="text-xs text-muted-foreground">Only sync changed data</p>
                        </div>
                        <Switch 
                          checked={advancedSyncConfig.incrementalSync}
                          onCheckedChange={(checked) => setAdvancedSyncConfig({...advancedSyncConfig, incrementalSync: checked})}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Delta Tracking</Label>
                          <p className="text-xs text-muted-foreground">Track data changes</p>
                        </div>
                        <Switch 
                          checked={advancedSyncConfig.deltaTracking}
                          onCheckedChange={(checked) => setAdvancedSyncConfig({...advancedSyncConfig, deltaTracking: checked})}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Compression</Label>
                          <p className="text-xs text-muted-foreground">Compress data in transit</p>
                        </div>
                        <Switch 
                          checked={advancedSyncConfig.compressionEnabled}
                          onCheckedChange={(checked) => setAdvancedSyncConfig({...advancedSyncConfig, compressionEnabled: checked})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Parallel Queries</Label>
                        <Select 
                          value={advancedSyncConfig.parallelQueries.toString()} 
                          onValueChange={(val) => setAdvancedSyncConfig({...advancedSyncConfig, parallelQueries: parseInt(val, 10)})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 4, 8, 16].map(num => (
                              <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-sm">Batch Size</Label>
                        <Select 
                          value={advancedSyncConfig.maxBatchSize.toString()}
                          onValueChange={(val) => setAdvancedSyncConfig({...advancedSyncConfig, maxBatchSize: parseInt(val, 10)})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1000, 5000, 10000, 25000, 50000].map(num => (
                              <SelectItem key={num} value={num.toString()}>{num.toLocaleString()}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-sm">Error Retries</Label>
                        <Input 
                          type="number" 
                          min="0" 
                          max="10" 
                          value={advancedSyncConfig.errorRetries}
                          onChange={(e) => setAdvancedSyncConfig({...advancedSyncConfig, errorRetries: parseInt(e.target.value, 10)})}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <Label>Notifications</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">On Failure</Label>
                        <Switch 
                          checked={advancedSyncConfig.notifyOnFailure}
                          onCheckedChange={(checked) => setAdvancedSyncConfig({...advancedSyncConfig, notifyOnFailure: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">On Success</Label>
                        <Switch 
                          checked={advancedSyncConfig.notifyOnSuccess}
                          onCheckedChange={(checked) => setAdvancedSyncConfig({...advancedSyncConfig, notifyOnSuccess: checked})}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Backup Before Sync</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="backup-before-sync" 
                        checked={advancedSyncConfig.backupBeforeSync}
                        onCheckedChange={(checked) => setAdvancedSyncConfig({...advancedSyncConfig, backupBeforeSync: checked === true})}
                      />
                      <label htmlFor="backup-before-sync" className="text-sm">
                        Create backup snapshot before synchronization
                      </label>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="specific" className="space-y-4">
                  {renderDatabaseSpecificOptions(selectedDatabase === "SAP HANA" ? "saphana" : "postgresql")}
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSyncSettingsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveSyncSettings}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Database;
