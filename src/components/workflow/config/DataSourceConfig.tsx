
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X, Mail, HardDrive } from 'lucide-react';
import { WorkflowStep } from '@/types/workflow';

interface DataSourceConfigProps {
  step: WorkflowStep;
  onConfigUpdate: (configKey: string, value: any) => void;
}

export const DataSourceConfig: React.FC<DataSourceConfigProps> = ({
  step,
  onConfigUpdate
}) => {
  const isGmailSource = step.config.emailConfig?.source === 'gmail';
  const isDriveSource = step.config.driveConfig?.source === 'google-drive';

  const handleEmailFilterAdd = () => {
    const currentFilters = step.config.emailConfig?.filters || [];
    const newFilters = [...currentFilters, ''];
    console.log('📧 Adding new email filter, total filters:', newFilters.length);
    
    onConfigUpdate('emailConfig', {
      ...step.config.emailConfig,
      filters: newFilters
    });
  };

  const handleEmailFilterUpdate = (index: number, value: string) => {
    const currentFilters = step.config.emailConfig?.filters || [];
    const newFilters = [...currentFilters];
    newFilters[index] = value;
    console.log('📧 Updating email filter', index, 'to:', value);
    
    onConfigUpdate('emailConfig', {
      ...step.config.emailConfig,
      filters: newFilters
    });
  };

  const handleEmailFilterRemove = (index: number) => {
    const currentFilters = step.config.emailConfig?.filters || [];
    const newFilters = currentFilters.filter((_, i) => i !== index);
    console.log('📧 Removing email filter', index, 'remaining:', newFilters.length);
    
    onConfigUpdate('emailConfig', {
      ...step.config.emailConfig,
      filters: newFilters
    });
  };

  const handleAttachmentTypeToggle = (type: string) => {
    const currentTypes = step.config.emailConfig?.attachmentTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    console.log('📎 Toggling attachment type:', type, 'new types:', newTypes);
    
    onConfigUpdate('emailConfig', {
      ...step.config.emailConfig,
      attachmentTypes: newTypes
    });
  };

  if (isGmailSource) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Gmail Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email Source</Label>
            <Select
              value={step.config.emailConfig?.source || 'gmail'}
              onValueChange={(value) => onConfigUpdate('emailConfig', {
                ...step.config.emailConfig,
                source: value
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gmail">Gmail</SelectItem>
                <SelectItem value="outlook">Outlook</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Email Search Filters</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEmailFilterAdd}
                className="h-8 gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Filter
              </Button>
            </div>
            
            <div className="space-y-2">
              {(step.config.emailConfig?.filters || []).map((filter, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={filter}
                    onChange={(e) => handleEmailFilterUpdate(index, e.target.value)}
                    placeholder="e.g., has:attachment subject:invoice from:vendor@company.com"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEmailFilterRemove(index)}
                    className="h-10 w-10 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {(!step.config.emailConfig?.filters || step.config.emailConfig.filters.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  No filters configured. Click "Add Filter" to add Gmail search criteria.
                </p>
              )}
            </div>
            
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
              <p className="font-medium mb-1">Gmail Search Examples:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <code>has:attachment</code> - Emails with attachments</li>
                <li>• <code>subject:invoice</code> - Subject contains "invoice"</li>
                <li>• <code>from:vendor@company.com</code> - From specific sender</li>
                <li>• <code>filename:pdf</code> - Has PDF attachments</li>
                <li>• <code>after:2024/01/01</code> - Emails after date</li>
              </ul>
            </div>
          </div>

          <div>
            <Label>Attachment Types to Process</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'png'].map((type) => (
                <Badge
                  key={type}
                  variant={step.config.emailConfig?.attachmentTypes?.includes(type) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleAttachmentTypeToggle(type)}
                >
                  {type.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Use Intelligent Email Filtering</Label>
              <p className="text-xs text-muted-foreground">
                AI will analyze email content to identify relevant documents
              </p>
            </div>
            <Switch
              checked={step.config.emailConfig?.useIntelligentFiltering || false}
              onCheckedChange={(checked) => {
                console.log('🤖 Toggling intelligent filtering:', checked);
                onConfigUpdate('emailConfig', {
                  ...step.config.emailConfig,
                  useIntelligentFiltering: checked
                });
              }}
            />
          </div>

          <div className="bg-gray-50 p-3 rounded text-sm">
            <p className="font-medium mb-1">Current Configuration:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Source: {step.config.emailConfig?.source || 'Gmail'}</li>
              <li>• Filters: {step.config.emailConfig?.filters?.length || 0} configured</li>
              <li>• Attachment Types: {step.config.emailConfig?.attachmentTypes?.join(', ') || 'None'}</li>
              <li>• Intelligent Filtering: {step.config.emailConfig?.useIntelligentFiltering ? 'Enabled' : 'Disabled'}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isDriveSource) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Google Drive Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Drive Source</Label>
            <Select
              value={step.config.driveConfig?.source || 'google-drive'}
              onValueChange={(value) => onConfigUpdate('driveConfig', {
                ...step.config.driveConfig,
                source: value
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google-drive">Google Drive</SelectItem>
                <SelectItem value="onedrive">OneDrive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Folder Path</Label>
            <Input
              value={step.config.driveConfig?.folderPath || ''}
              onChange={(e) => {
                console.log('📁 Updating folder path:', e.target.value);
                onConfigUpdate('driveConfig', {
                  ...step.config.driveConfig,
                  folderPath: e.target.value
                });
              }}
              placeholder="/Invoices/2024"
            />
          </div>

          <div>
            <Label>File Types to Process</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'png'].map((type) => (
                <Badge
                  key={type}
                  variant={step.config.driveConfig?.fileTypes?.includes(type) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    const currentTypes = step.config.driveConfig?.fileTypes || [];
                    const newTypes = currentTypes.includes(type)
                      ? currentTypes.filter(t => t !== type)
                      : [...currentTypes, type];
                    
                    console.log('📄 Toggling file type:', type, 'new types:', newTypes);
                    
                    onConfigUpdate('driveConfig', {
                      ...step.config.driveConfig,
                      fileTypes: newTypes
                    });
                  }}
                >
                  {type.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Process Subfolders</Label>
            <Switch
              checked={step.config.driveConfig?.processSubfolders || false}
              onCheckedChange={(checked) => {
                console.log('📂 Toggling subfolder processing:', checked);
                onConfigUpdate('driveConfig', {
                  ...step.config.driveConfig,
                  processSubfolders: checked
                });
              }}
            />
          </div>

          <div className="bg-gray-50 p-3 rounded text-sm">
            <p className="font-medium mb-1">Current Configuration:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Source: {step.config.driveConfig?.source || 'Google Drive'}</li>
              <li>• Folder: {step.config.driveConfig?.folderPath || 'Root'}</li>
              <li>• File Types: {step.config.driveConfig?.fileTypes?.join(', ') || 'None'}</li>
              <li>• Include Subfolders: {step.config.driveConfig?.processSubfolders ? 'Yes' : 'No'}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Source Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Select a data source type to configure specific settings.
        </p>
      </CardContent>
    </Card>
  );
};
