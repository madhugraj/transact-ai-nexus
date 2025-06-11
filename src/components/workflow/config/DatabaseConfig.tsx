
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Database, RefreshCw } from 'lucide-react';
import { WorkflowStep } from '@/types/workflow';
import { Textarea } from '@/components/ui/textarea';

interface DatabaseConfigProps {
  step: WorkflowStep;
  onConfigUpdate: (configKey: string, value: any) => void;
}

export const DatabaseConfig: React.FC<DatabaseConfigProps> = ({
  step,
  onConfigUpdate
}) => {
  const [availableConnections, setAvailableConnections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailableConnections();
  }, []);

  const loadAvailableConnections = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from your database connections
      const connections = ['Default Supabase', 'Production DB', 'Staging DB', 'Analytics DB'];
      setAvailableConnections(connections);
    } catch (error) {
      console.error('❌ Error loading connections:', error);
    } finally {
      setLoading(false);
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
              value={step.config.storageConfig?.connection || 'Default Supabase'}
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
                  <SelectItem key={conn} value={conn}>
                    {conn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAvailableConnections}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div>
          <Label>Target Table Name</Label>
          <Input
            value={step.config.storageConfig?.table || ''}
            onChange={(e) => onConfigUpdate('storageConfig', {
              ...step.config.storageConfig,
              table: e.target.value
            })}
            placeholder="e.g., extracted_invoices, processed_pos"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Table will be created automatically if it doesn't exist
          </p>
        </div>

        <div>
          <Label>Storage Action</Label>
          <Select
            value={step.config.storageConfig?.action || 'insert'}
            onValueChange={(value) => onConfigUpdate('storageConfig', {
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
            <li>• Connection: {step.config.storageConfig?.connection || 'Default Supabase'}</li>
            <li>• Table: {step.config.storageConfig?.table || 'Not specified'}</li>
            <li>• Action: {step.config.storageConfig?.action || 'Insert'}</li>
            <li>• Auto-create: {step.config.databaseOptions?.createIfNotExists !== false ? 'Yes' : 'No'}</li>
            <li>• Validation: {step.config.storageConfig?.validateBeforeInsert !== false ? 'Enabled' : 'Disabled'}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
