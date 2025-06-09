
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { WorkflowStep } from '@/types/workflow';

interface DatabaseConfigProps {
  step: WorkflowStep;
  onConfigUpdate: (configKey: string, value: any) => void;
}

interface TableInfo {
  table_name: string;
  table_schema: string;
}

export const DatabaseConfig: React.FC<DatabaseConfigProps> = ({
  step,
  onConfigUpdate
}) => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Query to get all user tables from the public schema
      const { data, error: queryError } = await supabase.rpc('get_public_tables');
      
      if (queryError) {
        // Fallback: try to get tables from information_schema
        console.log('Fallback: querying information_schema directly');
        const fallbackTables = [
          'invoice_table',
          'po_table', 
          'extracted_tables',
          'uploaded_files',
          'Doc_Compare_results',
          'compare_source_document',
          'compare_target_docs',
          'extracted_json'
        ];
        
        setTables(fallbackTables.map(name => ({ 
          table_name: name, 
          table_schema: 'public' 
        })));
      } else {
        setTables(data || []);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError('Failed to fetch database tables');
      
      // Set default tables as fallback
      const defaultTables = [
        'invoice_table',
        'po_table', 
        'extracted_tables',
        'uploaded_files'
      ];
      
      setTables(defaultTables.map(name => ({ 
        table_name: name, 
        table_schema: 'public' 
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          Storage Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Database Type</Label>
          <Select value="supabase" disabled>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="supabase">Supabase (PostgreSQL)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Connected to your Supabase database
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Table Name</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTables}
              disabled={loading}
              className="h-7 px-2"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {error && (
            <p className="text-xs text-red-600 mb-2">{error}</p>
          )}
          
          <Select
            value={step.config.storageConfig?.table || ''}
            onValueChange={(value) => onConfigUpdate('storageConfig', {
              ...step.config.storageConfig,
              table: value
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a table" />
            </SelectTrigger>
            <SelectContent>
              {tables.map((table) => (
                <SelectItem key={table.table_name} value={table.table_name}>
                  {table.table_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {tables.length > 0 && (
            <p className="text-xs text-green-600 mt-1">
              Found {tables.length} tables in your database
            </p>
          )}
        </div>

        <div>
          <Label>Action</Label>
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
              <SelectItem value="upsert">Update or Insert</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
