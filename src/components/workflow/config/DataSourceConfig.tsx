
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Mail, HardDrive, Sparkles, X, Plus } from 'lucide-react';
import { WorkflowStep } from '@/types/workflow';
import { useToast } from '@/hooks/use-toast';

interface DataSourceConfigProps {
  step: WorkflowStep;
  onConfigUpdate: (configKey: string, value: any) => void;
}

export const DataSourceConfig: React.FC<DataSourceConfigProps> = ({
  step,
  onConfigUpdate
}) => {
  const { toast } = useToast();
  const [newFilter, setNewFilter] = useState('');
  const [useIntelligentFiltering, setUseIntelligentFiltering] = useState(
    step.config.emailConfig?.useIntelligentFiltering || false
  );

  const currentFilters = step.config.emailConfig?.filters || [];

  const addFilter = () => {
    if (newFilter.trim() && !currentFilters.includes(newFilter.trim())) {
      const updatedFilters = [...currentFilters, newFilter.trim()];
      onConfigUpdate('emailConfig', {
        ...step.config.emailConfig,
        filters: updatedFilters
      });
      setNewFilter('');
      console.log('📧 Added filter:', newFilter.trim());
    }
  };

  const removeFilter = (filterToRemove: string) => {
    const updatedFilters = currentFilters.filter(filter => filter !== filterToRemove);
    onConfigUpdate('emailConfig', {
      ...step.config.emailConfig,
      filters: updatedFilters
    });
    console.log('📧 Removed filter:', filterToRemove);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addFilter();
    }
  };

  const enableIntelligentFiltering = () => {
    setUseIntelligentFiltering(true);
    onConfigUpdate('emailConfig', {
      ...step.config.emailConfig,
      useIntelligentFiltering: true,
      intelligentRules: {
        detectInvoices: true,
        checkAttachments: true,
        aiConfidenceThreshold: 0.7
      }
    });
    
    toast({
      title: "Intelligent Filtering Enabled",
      description: "Gemini AI will analyze emails for invoice indicators and attachments",
    });
  };

  const addCommonFilters = () => {
    const commonInvoiceFilters = ['invoice', 'billing', 'payment', 'receipt', 'statement'];
    const newFilters = [...new Set([...currentFilters, ...commonInvoiceFilters])];
    onConfigUpdate('emailConfig', {
      ...step.config.emailConfig,
      filters: newFilters
    });
    
    toast({
      title: "Common Filters Added",
      description: "Added common invoice-related keywords",
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
                  attachmentTypes: ['pdf'],
                  useIntelligentFiltering: false
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
          <div className="space-y-4">
            {/* Intelligent Filtering Toggle */}
            <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <Label className="font-medium">AI-Powered Invoice Detection</Label>
                </div>
                <Switch
                  checked={useIntelligentFiltering}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      enableIntelligentFiltering();
                    } else {
                      setUseIntelligentFiltering(false);
                      onConfigUpdate('emailConfig', {
                        ...step.config.emailConfig,
                        useIntelligentFiltering: false,
                        intelligentRules: undefined
                      });
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {useIntelligentFiltering 
                  ? "Gemini AI will analyze email content and attachments to identify likely invoices"
                  : "Enable to use AI for intelligent invoice detection beyond keyword filtering"
                }
              </p>
            </div>

            {/* Manual Filters Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Email Filters</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addCommonFilters}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Common
                </Button>
              </div>
              
              {/* Current Filters Display */}
              {currentFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentFilters.map((filter, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {filter}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-500" 
                        onClick={() => removeFilter(filter)}
                      />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add New Filter */}
              <div className="flex gap-2">
                <Input
                  placeholder="Type keyword and press Enter or comma..."
                  value={newFilter}
                  onChange={(e) => setNewFilter(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1"
                />
                <Button 
                  onClick={addFilter} 
                  size="sm"
                  disabled={!newFilter.trim()}
                >
                  Add
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Press Enter or comma to add filters. Examples: invoice, billing, purchase order, receipt
              </p>
            </div>

            {/* Attachment Types */}
            <div className="space-y-2">
              <Label>Attachment Types to Process</Label>
              <div className="flex flex-wrap gap-2">
                {['pdf', 'png', 'jpg', 'jpeg'].map((type) => (
                  <Badge 
                    key={type}
                    variant={step.config.emailConfig?.attachmentTypes?.includes(type) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const currentTypes = step.config.emailConfig?.attachmentTypes || [];
                      const updatedTypes = currentTypes.includes(type)
                        ? currentTypes.filter(t => t !== type)
                        : [...currentTypes, type];
                      
                      onConfigUpdate('emailConfig', {
                        ...step.config.emailConfig,
                        attachmentTypes: updatedTypes
                      });
                    }}
                  >
                    {type.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-3 rounded text-sm">
              <p className="font-medium mb-1">Configuration Summary:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Source: Gmail</li>
                <li>• Manual filters: {currentFilters.length > 0 ? currentFilters.join(', ') : 'None'}</li>
                <li>• AI Detection: {useIntelligentFiltering ? 'Enabled' : 'Disabled'}</li>
                <li>• Attachment types: {step.config.emailConfig?.attachmentTypes?.join(', ') || 'PDF'}</li>
              </ul>
            </div>
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
