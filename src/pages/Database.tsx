
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/components/auth/UserAuthContext";
import DatabaseConnections from "@/components/database/DatabaseConnections";
import ConnectionDialog from "@/components/database/ConnectionDialog";
import SyncSettingsDialog from "@/components/database/SyncSettingsDialog";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const Database = () => {
  const { user } = useAuth();
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showSyncSettingsDialog, setShowSyncSettingsDialog] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  
  // Role-based access control
  const canManageConnections = user?.role === 'admin' || user?.role === 'finance_analyst';
  const isReadOnly = user?.role === 'auditor';

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

  const handleCompleteSetup = () => {
    toast.success("SAP HANA setup completed successfully");
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Database Connections</h1>
          <ConnectionDialog 
            show={showConnectionDialog} 
            onOpenChange={setShowConnectionDialog}
            canManageConnections={canManageConnections}
          />
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

        <DatabaseConnections 
          canManageConnections={canManageConnections}
          isReadOnly={isReadOnly}
          onOpenConnection={() => setShowConnectionDialog(true)}
          onStartSync={startDatabaseSync}
          onOpenSyncSettings={openSyncSettings}
          onCompleteSetup={handleCompleteSetup}
          isSyncing={isSyncing}
        />
      </div>

      {/* Database Synchronization Settings Dialog */}
      <SyncSettingsDialog
        open={showSyncSettingsDialog}
        onOpenChange={setShowSyncSettingsDialog}
        selectedDatabase={selectedDatabase}
      />
    </AppLayout>
  );
};

export default Database;
