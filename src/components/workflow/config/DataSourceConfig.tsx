
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, HardDrive } from 'lucide-react';
import { WorkflowStep } from '@/types/workflow';

interface DataSourceConfigProps {
  step: WorkflowStep;
  onConfigUpdate: (configKey: string, value: any) => void;
}

export const DataSourceConfig: React.FC<DataSourceConfigProps> = ({
  step,
  onConfigUpdate
}) => {
  const handleEmailFiltersChange = (value: string) => {
    // Split by comma and clean up each filter
    const filters = value
      .split(',')
      .map(filter => filter.trim())
      .filter(filter => filter.length > 0);
    
    onConfigUpdate('emailConfig', {
      ...step.config.emailConfig,
      filters
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Data Source Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="sourceType">Source Type</Label>
          <Select
            value={step.config.emailConfig ? 'email' : step.config.driveConfig ? 'drive' : ''}
            onValueChange={(value) => {
              if (value === 'email') {
                onConfigUpdate('emailConfig', { 
                  source: 'gmail', 
                  filters: [], 
                  attachmentTypes: ['pdf'] 
                });
                onConfigUpdate('driveConfig', undefined);
              } else if (value === 'drive') {
                onConfigUpdate('driveConfig', { 
                  source: 'google-drive', 
                  fileTypes: ['pdf'] 
                });
                onConfigUpdate('emailConfig', undefined);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select source type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email (Gmail)</SelectItem>
              <SelectItem value="drive">Google Drive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {step.config.emailConfig && (
          <div className="space-y-2">
            <Label>Email Filters</Label>
            <Input
              placeholder="invoice, billing, purchase order"
              value={step.config.emailConfig.filters?.join(', ') || ''}
              onChange={(e) => handleEmailFiltersChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter keywords separated by commas. Example: invoice, billing, purchase order
            </p>
            {step.config.emailConfig.filters && step.config.emailConfig.filters.length > 0 && (
              <div className="text-xs text-green-600">
                Active filters: {step.config.emailConfig.filters.join(', ')}
              </div>
            )}
          </div>
        )}

        {step.config.driveConfig && (
          <div className="space-y-2">
            <Label>Folder Path</Label>
            <Input
              placeholder="/Documents/Invoices"
              value={step.config.driveConfig.folderPath || ''}
              onChange={(e) => onConfigUpdate('driveConfig', {
                ...step.config.driveConfig,
                folderPath: e.target.value
              })}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
