
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProcessingOptions } from '@/types/processing';

interface DatabasePushSettingsProps {
  processingOptions: ProcessingOptions;
  setProcessingOptions: React.Dispatch<React.SetStateAction<ProcessingOptions>>;
}

export const DatabasePushSettings: React.FC<DatabasePushSettingsProps> = ({ 
  processingOptions, 
  setProcessingOptions 
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Database Connection</Label>
        <Select 
          value={processingOptions.databaseOptions?.connection}
          onValueChange={(val) => setProcessingOptions(prev => ({
            ...prev,
            databaseOptions: {
              ...prev.databaseOptions,
              connection: val
            }
          }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ERP Database">ERP Database (PostgreSQL)</SelectItem>
            <SelectItem value="SAP HANA">SAP HANA</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Table Name</Label>
        <Input 
          placeholder="Enter table name" 
          value={processingOptions.databaseOptions?.tableName}
          onChange={(e) => setProcessingOptions(prev => ({
            ...prev,
            databaseOptions: {
              ...prev.databaseOptions,
              tableName: e.target.value
            }
          }))}
        />
        <p className="text-xs text-muted-foreground">
          Name of the table to store the data
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="create-table"
          checked={processingOptions.databaseOptions?.createIfNotExists}
          onCheckedChange={(checked) => setProcessingOptions(prev => ({
            ...prev,
            databaseOptions: {
              ...prev.databaseOptions,
              createIfNotExists: checked === true
            }
          }))}
        />
        <label htmlFor="create-table" className="text-sm">
          Create table if it doesn't exist
        </label>
      </div>
      
      <div className="space-y-2">
        <Label>Insert Method</Label>
        <Select defaultValue="insert">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="insert">Insert new rows</SelectItem>
            <SelectItem value="upsert">Upsert (update if exists)</SelectItem>
            <SelectItem value="replace">Replace table contents</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
