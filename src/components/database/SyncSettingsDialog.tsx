
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Clock, AlertCircle, Calendar } from "lucide-react";

interface SyncSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDatabase: string | null;
}

interface AdvancedSyncConfig {
  incrementalSync: boolean;
  deltaTracking: boolean;
  compressionEnabled: boolean;
  parallelQueries: number;
  maxBatchSize: number;
  errorRetries: number;
  logLevel: string;
  notifyOnFailure: boolean;
  notifyOnSuccess: boolean;
  backupBeforeSync: boolean;
}

const SyncSettingsDialog = ({ open, onOpenChange, selectedDatabase }: SyncSettingsDialogProps) => {
  const [syncFrequency, setSyncFrequency] = useState("30");
  const [retentionDays, setRetentionDays] = useState("90");
  const [advancedSyncConfig, setAdvancedSyncConfig] = useState<AdvancedSyncConfig>({
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

  const saveSyncSettings = () => {
    toast.success(`Sync settings for ${selectedDatabase} saved successfully`);
    onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={saveSyncSettings}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SyncSettingsDialog;
