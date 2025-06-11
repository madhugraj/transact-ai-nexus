
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Database, RefreshCw, Table } from 'lucide-react';
import { WorkflowStep } from '@/types/workflow';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DatabaseConfigProps {
  step: WorkflowStep;
  onConfigUpdate: (configKey: string, value: any) => void;
}

interface DatabaseConnection {
  name: string;
  id: string;
}

interface DatabaseTable {
  name: string;
  schema: string;
}

export const DatabaseConfig: React.FC<DatabaseConfigProps> = ({
  step,
  onConfigUpdate
}) => {
  const [availableConnections, setAvailableConnections] = useState<DatabaseConnection[]>([]);
  const [availableTables, setAvailableTables] = useState<DatabaseTable[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [hasTableLoadError, setHasTableLoadError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAvailableConnections();
  }, []);

  useEffect(() => {
    if (step.config.storageConfig?.connection) {
      loadAvailableTables(step.config.storageConfig.connection);
    }
  }, [step.config.storageConfig?.connection]);

  const loadAvailableConnections = async () => {
    setLoadingConnections(true);
    try {
      // In a production app, this would make an API call to fetch actual database connections
      const connections: DatabaseConnection[] = [
        { name: 'TransactionAgent', id: 'transaction_agent' },
        { name: 'Default Supabase', id: 'default_supabase' },
        { name: 'Production DB', id: 'production_db' },
        { name: 'Staging DB', id: 'staging_db' },
        { name: 'Analytics DB', id: 'analytics_db' }
      ];
      
      setAvailableConnections(connections);
      
      // If we don't have a connection selected yet, select the first one
      if (!step.config.storageConfig?.connection && connections.length > 0) {
        onConfigUpdate('storageConfig', {
          ...step.config.storageConfig,
          connection: connections[0].id
        });
      }
    } catch (error) {
      console.error('❌ Error loading connections:', error);
      toast({
        title: "Error loading database connections",
        description: "Could not retrieve available database connections",
        variant: "destructive"
      });
    } finally {
      setLoadingConnections(false);
    }
  };

  const loadAvailableTables = async (connectionId: string) => {
    setLoadingTables(true);
    setHasTableLoadError(false);
    
    try {
      let tables: DatabaseTable[] = [];
      
      // For TransactionAgent or Default Supabase, fetch actual tables from Supabase
      if (connectionId === 'transaction_agent' || connectionId === 'default_supabase') {
        try {
          console.log('Attempting to fetch tables from Supabase...');
          
          // Try to fetch tables from Supabase with better error handling
          const { data, error } = await supabase
            .from('pg_tables')
            .select('tablename, schemaname')
            .eq('schemaname', 'public')
            .order('tablename', { ascending: true });
          
          if (error) {
            console.error('Supabase query error:', error);
            throw error;
          }
          
          if (data && data.length > 0) {
            console.log(`✅ Successfully fetched ${data.length} tables from Supabase`);
            tables = data.map(t => ({
              name: t.tablename,
              schema: t.schemaname
            }));
          } else {
            console.warn('⚠️ No tables returned from Supabase query');
          }
        } catch (supabaseError) {
          console.error('❌ Supabase table fetch error:', supabaseError);
          setHasTableLoadError(true);
          
          // Fall back to hardcoded tables since we couldn't fetch from Supabase
          console.log('Falling back to hardcoded tables');
        }
        
        // If Supabase query fails or returns no results, fall back to hardcoded tables
        if (tables.length === 0) {
          tables = [
            { name: 'invoice_table', schema: 'public' },
            { name: 'po_table', schema: 'public' },
            { name: 'compare_po_invoice_table', schema: 'public' },
            { name: 'compare_po_multi_invoice', schema: 'public' },
            { name: 'extracted_json', schema: 'public' },
            { name: 'compare_source_document', schema: 'public' },
            { name: 'compare_target_docs', schema: 'public' },
            { name: 'doc_compare_results', schema: 'public' },
            { name: 'extracted_tables', schema: 'public' },
            { name: 'uploaded_files', schema: 'public' }
          ];
          console.log(`Using ${tables.length} hardcoded tables as fallback`);
        }
      } else {
        // For other connections, use mock data
        switch (connectionId) {
          case 'analytics_db':
            tables = [
              { name: 'invoice_analytics', schema: 'public' },
              { name: 'po_analytics', schema: 'public' },
              { name: 'comparison_metrics', schema: 'public' }
            ];
            break;
          case 'production_db':
            tables = [
              { name: 'customers', schema: 'public' },
              { name: 'orders', schema: 'public' },
              { name: 'products', schema: 'public' }
            ];
            break;
          default:
            tables = [
              { name: 'test_data', schema: 'public' },
              { name: 'staging_invoices', schema: 'public' }
            ];
        }
      }
      
      setAvailableTables(tables);
      console.log(`Total available tables: ${tables.length}`);
      
    } catch (error) {
      console.error('❌ Error loading tables:', error);
      setHasTableLoadError(true);
      
      // Even if there's an error, populate some fallback tables
      setAvailableTables([
        { name: 'invoice_table', schema: 'public' },
        { name: 'po_table', schema: 'public' },
        { name: 'compare_po_invoice_table', schema: 'public' }
      ]);
      
      toast({
        title: "Error loading database tables",
        description: "Using default tables as fallback. You can still enter a custom table name.",
        variant: "destructive"
      });
    } finally {
      setLoadingTables(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          Data Storage Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Database Connection</Label>
          <div className="flex gap-2">
            <Select
              value={step.config.storageConfig?.connection || (availableConnections[0]?.id || 'default_supabase')}
              onValueChange={(value) => onConfigUpdate('storageConfig', {
                ...step.config.storageConfig,
                connection: value
              })}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableConnections.map(conn => (
                  <SelectItem key={conn.id} value={conn.id}>
                    {conn.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAvailableConnections}
              disabled={loadingConnections}
            >
              <RefreshCw className={`h-3 w-3 ${loadingConnections ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div>
          <Label>Target Table Name</Label>
          <div className="flex gap-2">
            <Select
              value={step.config.storageConfig?.table || ''}
              onValueChange={(value) => onConfigUpdate('storageConfig', {
                ...step.config.storageConfig,
                table: value
              })}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a table or enter custom name" />
              </SelectTrigger>
              <SelectContent>
                {availableTables.map(table => (
                  <SelectItem key={`${table.schema}.${table.name}`} value={table.name}>
                    {table.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => step.config.storageConfig?.connection && 
                loadAvailableTables(step.config.storageConfig.connection)}
              disabled={loadingTables || !step.config.storageConfig?.connection}
            >
              <RefreshCw className={`h-3 w-3 ${loadingTables ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="flex items-center mt-2">
            <Input
              value={step.config.storageConfig?.table || ''}
              onChange={(e) => onConfigUpdate('storageConfig', {
                ...step.config.storageConfig,
                table: e.target.value
              })}
              placeholder="e.g., extracted_invoices, processed_pos"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Table will be created automatically if it doesn't exist
          </p>
        </div>

        <div>
          <Label>Storage Action</Label>
          <Select
            value={step.config.storageConfig?.action || 'insert'}
            onValueChange={(value: "insert" | "upsert" | "update" | "replace") => onConfigUpdate('storageConfig', {
              ...step.config.storageConfig,
              action: value
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="insert">Insert New Records</SelectItem>
              <SelectItem value="upsert">Insert or Update (Upsert)</SelectItem>
              <SelectItem value="update">Update Existing Records</SelectItem>
              <SelectItem value="replace">Replace Existing Data</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Field Mapping (Optional)</Label>
          <Textarea
            value={step.config.storageConfig?.mapping ? JSON.stringify(step.config.storageConfig.mapping, null, 2) : ''}
            onChange={(e) => {
              try {
                const mapping = e.target.value ? JSON.parse(e.target.value) : {};
                onConfigUpdate('storageConfig', {
                  ...step.config.storageConfig,
                  mapping
                });
              } catch (error) {
                // Invalid JSON, don't update
              }
            }}
            placeholder={`{
  "extracted_vendor": "vendor_name",
  "extracted_amount": "total_amount",
  "extracted_date": "invoice_date"
}`}
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Map extracted fields to database columns (JSON format)
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Label>Auto-create Schema</Label>
          <Switch
            checked={step.config.databaseOptions?.createIfNotExists !== false}
            onCheckedChange={(checked) => onConfigUpdate('databaseOptions', {
              ...step.config.databaseOptions,
              createIfNotExists: checked
            })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Validate Before Insert</Label>
          <Switch
            checked={step.config.storageConfig?.validateBeforeInsert !== false}
            onCheckedChange={(checked) => onConfigUpdate('storageConfig', {
              ...step.config.storageConfig,
              validateBeforeInsert: checked
            })}
          />
        </div>

        <div className="bg-gray-50 p-3 rounded text-sm">
          <p className="font-medium mb-1">Storage Configuration:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Connection: {step.config.storageConfig?.connection ? availableConnections.find(c => c.id === step.config.storageConfig?.connection)?.name || step.config.storageConfig?.connection : 'Default Supabase'}</li>
            <li>• Table: {step.config.storageConfig?.table || 'Not specified'}</li>
            <li>• Action: {step.config.storageConfig?.action || 'Insert'}</li>
            <li>• Auto-create: {step.config.databaseOptions?.createIfNotExists !== false ? 'Yes' : 'No'}</li>
            <li>• Validation: {step.config.storageConfig?.validateBeforeInsert !== false ? 'Enabled' : 'Disabled'}</li>
          </ul>
          {loadingTables && 
            <div className="flex items-center gap-2 mt-2 text-xs text-blue-600">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Loading available tables...
            </div>
          }
          {hasTableLoadError &&
            <div className="flex items-center gap-2 mt-2 text-xs text-amber-600">
              <Table className="h-3 w-3" />
              Using fallback tables due to connection error
            </div>
          }
        </div>
      </CardContent>
    </Card>
  );
};
