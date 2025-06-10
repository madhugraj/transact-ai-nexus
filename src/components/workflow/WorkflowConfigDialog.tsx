
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { WorkflowStep } from '@/types/workflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WorkflowConfigDialogProps {
  step: WorkflowStep | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (step: WorkflowStep) => void;
}

// All 11 database tables available in the system
const DATABASE_TABLES = [
  'Doc_Compare_results',
  'compare_po_invoice_table', 
  'compare_po_multi_invoice',
  'compare_source_document',
  'compare_target_docs',
  'extracted_json',
  'extracted_tables',
  'invoice_table',
  'po_table',
  'profiles',
  'uploaded_files'
];

const COMPARISON_FIELDS = [
  'vendor_name',
  'vendor_code', 
  'po_number',
  'invoice_number',
  'total_amount',
  'line_items',
  'po_date',
  'invoice_date',
  'description',
  'quantity',
  'unit_price',
  'tax_amount'
];

export const WorkflowConfigDialog: React.FC<WorkflowConfigDialogProps> = ({
  step,
  isOpen,
  onClose,
  onSave
}) => {
  const [editedStep, setEditedStep] = useState<WorkflowStep | null>(null);

  useEffect(() => {
    if (step) {
      console.log('🔧 Opening config dialog for step:', step.id, step.type);
      setEditedStep({ ...step });
    }
  }, [step]);

  const handleSave = () => {
    if (editedStep) {
      console.log('💾 Saving step configuration:', editedStep.id, editedStep.config);
      onSave(editedStep);
      onClose();
    }
  };

  const updateStepConfig = (configUpdate: any) => {
    if (editedStep) {
      setEditedStep({
        ...editedStep,
        config: {
          ...editedStep.config,
          ...configUpdate
        }
      });
    }
  };

  const updateComparisonConfig = (comparisonUpdate: any) => {
    updateStepConfig({
      comparisonConfig: {
        ...editedStep?.config?.comparisonConfig,
        ...comparisonUpdate
      }
    });
  };

  const updateEmailConfig = (emailUpdate: any) => {
    updateStepConfig({
      emailConfig: {
        ...editedStep?.config?.emailConfig,
        ...emailUpdate
      }
    });
  };

  const updateDriveConfig = (driveUpdate: any) => {
    updateStepConfig({
      driveConfig: {
        ...editedStep?.config?.driveConfig,
        ...driveUpdate
      }
    });
  };

  const updateProcessingConfig = (processingUpdate: any) => {
    updateStepConfig({
      processingConfig: {
        ...editedStep?.config?.processingConfig,
        ...processingUpdate
      }
    });
  };

  const updateStorageConfig = (storageUpdate: any) => {
    updateStepConfig({
      storageConfig: {
        ...editedStep?.config?.storageConfig,
        ...storageUpdate
      }
    });
  };

  if (!editedStep) return null;

  const renderDataSourceConfig = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Email Source Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Email Source</Label>
            <Select 
              value={editedStep.config?.emailConfig?.source || 'gmail'}
              onValueChange={(value) => updateEmailConfig({ source: value })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gmail">Gmail</SelectItem>
                <SelectItem value="outlook">Outlook</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-xs">Search Filters</Label>
            <Input
              value={editedStep.config?.emailConfig?.filters?.join(', ') || 'has:attachment'}
              onChange={(e) => updateEmailConfig({ filters: e.target.value.split(', ') })}
              placeholder="has:attachment, from:vendor@company.com"
              className="h-8 text-xs"
            />
          </div>

          <div>
            <Label className="text-xs">Attachment Types</Label>
            <Input
              value={editedStep.config?.emailConfig?.attachmentTypes?.join(', ') || 'pdf, png, jpg'}
              onChange={(e) => updateEmailConfig({ attachmentTypes: e.target.value.split(', ') })}
              placeholder="pdf, png, jpg, xlsx"
              className="h-8 text-xs"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={editedStep.config?.emailConfig?.useIntelligentFiltering || false}
              onCheckedChange={(checked) => updateEmailConfig({ useIntelligentFiltering: checked })}
            />
            <Label className="text-xs">Use AI-powered filtering</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Drive Source Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Drive Source</Label>
            <Select 
              value={editedStep.config?.driveConfig?.source || 'google-drive'}
              onValueChange={(value) => updateDriveConfig({ source: value })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google-drive">Google Drive</SelectItem>
                <SelectItem value="onedrive">OneDrive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-xs">Folder Path</Label>
            <Input
              value={editedStep.config?.driveConfig?.folderPath || ''}
              onChange={(e) => updateDriveConfig({ folderPath: e.target.value })}
              placeholder="/PO Documents"
              className="h-8 text-xs"
            />
          </div>

          <div>
            <Label className="text-xs">File Types</Label>
            <Input
              value={editedStep.config?.driveConfig?.fileTypes?.join(', ') || 'pdf, png, jpg'}
              onChange={(e) => updateDriveConfig({ fileTypes: e.target.value.split(', ') })}
              placeholder="pdf, png, jpg, xlsx"
              className="h-8 text-xs"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDocumentProcessingConfig = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Document Processing Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs">Processing Type</Label>
          <Select 
            value={editedStep.config?.processingConfig?.type || 'invoice-extraction'}
            onValueChange={(value) => updateProcessingConfig({ type: value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invoice-extraction">Invoice Extraction</SelectItem>
              <SelectItem value="po-extraction">PO Extraction</SelectItem>
              <SelectItem value="general-ocr">General OCR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-xs">AI Model</Label>
          <Select 
            value={editedStep.config?.processingConfig?.aiModel || 'gemini'}
            onValueChange={(value) => updateProcessingConfig({ aiModel: value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini">Google Gemini</SelectItem>
              <SelectItem value="openai">OpenAI GPT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Confidence Threshold</Label>
          <Input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={editedStep.config?.processingConfig?.confidence || 0.8}
            onChange={(e) => updateProcessingConfig({ confidence: parseFloat(e.target.value) })}
            className="h-8 text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderDataComparisonConfig = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Data Comparison Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs">Comparison Type</Label>
          <Select 
            value={editedStep.config?.comparisonConfig?.type || 'po-invoice-comparison'}
            onValueChange={(value) => updateComparisonConfig({ type: value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="po-invoice-comparison">PO vs Invoice Comparison</SelectItem>
              <SelectItem value="jd-cv-comparison">Job Description vs CV</SelectItem>
              <SelectItem value="custom-comparison">Custom Comparison</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Matching Criteria</Label>
          <Select 
            value={editedStep.config?.comparisonConfig?.matchingCriteria || 'fuzzy'}
            onValueChange={(value) => updateComparisonConfig({ matchingCriteria: value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exact">Exact Match</SelectItem>
              <SelectItem value="fuzzy">Fuzzy Match</SelectItem>
              <SelectItem value="threshold">Threshold Based</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Tolerance Level</Label>
          <Input
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={editedStep.config?.comparisonConfig?.tolerance || 0.8}
            onChange={(e) => updateComparisonConfig({ tolerance: parseFloat(e.target.value) })}
            className="h-8 text-xs"
          />
          <div className="text-xs text-muted-foreground mt-1">
            0.0 = Exact match, 1.0 = Very loose matching
          </div>
        </div>

        <div>
          <Label className="text-xs">Source Table</Label>
          <Select 
            value={editedStep.config?.comparisonConfig?.sourceTable || 'po_table'}
            onValueChange={(value) => updateComparisonConfig({ sourceTable: value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATABASE_TABLES.map(table => (
                <SelectItem key={table} value={table}>{table}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Target Table</Label>
          <Select 
            value={editedStep.config?.comparisonConfig?.targetTable || 'invoice_table'}
            onValueChange={(value) => updateComparisonConfig({ targetTable: value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATABASE_TABLES.map(table => (
                <SelectItem key={table} value={table}>{table}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Fields to Compare</Label>
          <div className="flex flex-wrap gap-1 mt-2">
            {COMPARISON_FIELDS.map(field => {
              const isSelected = editedStep.config?.comparisonConfig?.fields?.includes(field);
              return (
                <Badge 
                  key={field}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => {
                    const currentFields = editedStep.config?.comparisonConfig?.fields || [];
                    const newFields = isSelected 
                      ? currentFields.filter(f => f !== field)
                      : [...currentFields, field];
                    updateComparisonConfig({ fields: newFields });
                  }}
                >
                  {field}
                </Badge>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderDataStorageConfig = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Database Storage Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs">Target Table</Label>
          <Select 
            value={editedStep.config?.storageConfig?.table || 'extracted_json'}
            onValueChange={(value) => updateStorageConfig({ table: value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATABASE_TABLES.map(table => (
                <SelectItem key={table} value={table}>{table}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-xs">Action</Label>
          <Select 
            value={editedStep.config?.storageConfig?.action || 'insert'}
            onValueChange={(value) => updateStorageConfig({ action: value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="insert">Insert New Records</SelectItem>
              <SelectItem value="upsert">Insert or Update</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  const renderAnalyticsConfig = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Analytics Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs">Analytics Type</Label>
          <Select 
            value={editedStep.config?.analyticsConfig?.type || 'comparison'}
            onValueChange={(value) => updateStorageConfig({ analyticsConfig: { ...editedStep.config?.analyticsConfig, type: value } })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comparison">Comparison Report</SelectItem>
              <SelectItem value="trends">Trend Analysis</SelectItem>
              <SelectItem value="summary">Summary Statistics</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  const renderConfigContent = () => {
    switch (editedStep.type) {
      case 'data-source':
        return renderDataSourceConfig();
      case 'document-processing':
        return renderDocumentProcessingConfig();
      case 'data-comparison':
        return renderDataComparisonConfig();
      case 'data-storage':
        return renderDataStorageConfig();
      case 'analytics':
        return renderAnalyticsConfig();
      default:
        return (
          <div className="text-center text-muted-foreground py-8">
            <p>No specific configuration available for this component type.</p>
            <p className="text-xs mt-2">This component will use default settings.</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Configure: {editedStep.name}
            <Badge variant="outline" className="text-xs">{editedStep.type}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Configuration */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Component Name</Label>
              <Input
                value={editedStep.name}
                onChange={(e) => setEditedStep({ ...editedStep, name: e.target.value })}
                className="h-8"
              />
            </div>
            
            <div>
              <Label className="text-sm">Description</Label>
              <Textarea
                value={editedStep.description || ''}
                onChange={(e) => setEditedStep({ ...editedStep, description: e.target.value })}
                placeholder="Describe what this component does..."
                className="min-h-[60px] text-xs"
              />
            </div>
          </div>

          {/* Type-specific Configuration */}
          {renderConfigContent()}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
