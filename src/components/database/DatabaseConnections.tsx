
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Database as DatabaseIcon, Table, Settings, RefreshCw } from "lucide-react";

interface DatabaseConnectionsProps {
  canManageConnections: boolean;
  isReadOnly: boolean;
  onOpenConnection: () => void;
  onStartSync: (dbName: string) => void;
  onOpenSyncSettings: (dbName: string) => void;
  onCompleteSetup: () => void;
  isSyncing: boolean;
}

const DatabaseConnections = ({
  canManageConnections,
  isReadOnly,
  onOpenConnection,
  onStartSync,
  onOpenSyncSettings,
  onCompleteSetup,
  isSyncing
}: DatabaseConnectionsProps) => {
  return (
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
              onClick={() => onOpenSyncSettings("ERP Database")}
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
              onClick={() => onStartSync("ERP Database")}
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
            <Button variant="default" size="sm" className="w-full mt-4" onClick={onCompleteSetup}>
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
              onClick={onOpenConnection}
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
  );
};

export default DatabaseConnections;
