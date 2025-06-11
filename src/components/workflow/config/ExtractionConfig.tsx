
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { FileText, Sliders } from 'lucide-react';
import { WorkflowStep } from '@/types/workflow';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface ExtractionConfigProps {
  step: WorkflowStep;
  onConfigUpdate: (configKey: string, value: any) => void;
}

export const ExtractionConfig: React.FC<ExtractionConfigProps> = ({
  step,
  onConfigUpdate
}) => {
  const documentTypes = ['invoice', 'purchase-order', 'receipt', 'contract', 'general-document'];
  const extractionMethods = ['ocr', 'ai-vision', 'template-based', 'hybrid'];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Data Extraction Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Document Source Type</Label>
          <Select
            value={step.config.processingConfig?.type || 'general-ocr'}
            onValueChange={(value) => onConfigUpdate('processingConfig', {
              ...step.config.processingConfig,
              type: value
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invoice-extraction">Invoice Data</SelectItem>
              <SelectItem value="po-extraction">Purchase Order Data</SelectItem>
              <SelectItem value="receipt-extraction">Receipt Data</SelectItem>
              <SelectItem value="contract-extraction">Contract Data</SelectItem>
              <SelectItem value="general-ocr">General Document OCR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Extraction Method</Label>
          <Select
            value={step.config.processingConfig?.aiModel || 'hybrid'}
            onValueChange={(value) => onConfigUpdate('processingConfig', {
              ...step.config.processingConfig,
              aiModel: value
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ocr">Traditional OCR</SelectItem>
              <SelectItem value="ai-vision">AI Vision Processing</SelectItem>
              <SelectItem value="template-based">Template Matching</SelectItem>
              <SelectItem value="hybrid">Hybrid (AI + OCR)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Confidence Threshold: {step.config.processingConfig?.confidence || 0.8}</Label>
          <Input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={step.config.processingConfig?.confidence || 0.8}
            onChange={(e) => onConfigUpdate('processingConfig', {
              ...step.config.processingConfig,
              confidence: parseFloat(e.target.value)
            })}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Higher values require more confident extraction results
          </p>
        </div>

        <div className="space-y-2">
          <Label>OCR Language</Label>
          <Select
            value={step.config.ocrSettings?.language || 'eng'}
            onValueChange={(value) => onConfigUpdate('ocrSettings', {
              ...step.config.ocrSettings,
              language: value
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eng">English</SelectItem>
              <SelectItem value="fra">French</SelectItem>
              <SelectItem value="deu">German</SelectItem>
              <SelectItem value="spa">Spanish</SelectItem>
              <SelectItem value="chi_sim">Chinese (Simplified)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Custom Extraction Prompt</Label>
          <Textarea
            value={step.config.ocrSettings?.customPrompt || ''}
            onChange={(e) => onConfigUpdate('ocrSettings', {
              ...step.config.ocrSettings,
              customPrompt: e.target.value
            })}
            placeholder="Enter specific instructions for data extraction..."
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Enhanced Resolution</Label>
          <Switch
            checked={step.config.ocrSettings?.enhanceResolution || false}
            onCheckedChange={(checked) => onConfigUpdate('ocrSettings', {
              ...step.config.ocrSettings,
              enhanceResolution: checked
            })}
          />
        </div>

        <div className="bg-gray-50 p-3 rounded text-sm">
          <p className="font-medium mb-1">Extraction Configuration:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Type: {step.config.processingConfig?.type || 'General OCR'}</li>
            <li>• Method: {step.config.processingConfig?.aiModel || 'Hybrid'}</li>
            <li>• Confidence: {((step.config.processingConfig?.confidence || 0.8) * 100).toFixed(0)}%</li>
            <li>• Language: {step.config.ocrSettings?.language || 'English'}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
