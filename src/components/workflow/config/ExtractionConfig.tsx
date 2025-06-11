
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

// Pre-written prompts based on document types that we've been using
const EXTRACTION_PROMPTS = {
  'invoice-extraction': `You are an expert AI assistant specialized in extracting structured data from invoice documents. Extract the following information and return it in JSON format:

REQUIRED FIELDS:
- invoice_number: String
- vendor_name: String  
- vendor_address: String
- invoice_date: Date (YYYY-MM-DD format)
- due_date: Date (YYYY-MM-DD format)
- subtotal: Number
- tax_amount: Number
- total_amount: Number
- currency: String
- po_number: String (if available)
- payment_terms: String

LINE ITEMS (as array):
- description: String
- quantity: Number
- unit_price: Number
- line_total: Number

Return JSON in this exact format:
{
  "invoice_number": "",
  "vendor_name": "",
  "vendor_address": "",
  "invoice_date": "",
  "due_date": "",
  "subtotal": 0,
  "tax_amount": 0,
  "total_amount": 0,
  "currency": "",
  "po_number": "",
  "payment_terms": "",
  "line_items": [
    {
      "description": "",
      "quantity": 0,
      "unit_price": 0,
      "line_total": 0
    }
  ]
}`,

  'po-extraction': `You are an expert AI assistant specialized in extracting structured data from Purchase Order documents. Extract the following information and return it in JSON format:

REQUIRED FIELDS:
- po_number: String
- vendor_name: String
- vendor_code: String
- vendor_address: String
- po_date: Date (YYYY-MM-DD format)
- delivery_date: Date (YYYY-MM-DD format)
- ship_to_address: String
- bill_to_address: String
- project: String
- terms_conditions: String
- subtotal: Number
- tax_amount: Number
- total_amount: Number
- currency: String

LINE ITEMS (as array):
- item_code: String
- description: String
- quantity: Number
- unit_price: Number
- line_total: Number

Return JSON in this exact format:
{
  "po_number": "",
  "vendor_name": "",
  "vendor_code": "",
  "vendor_address": "",
  "po_date": "",
  "delivery_date": "",
  "ship_to_address": "",
  "bill_to_address": "",
  "project": "",
  "terms_conditions": "",
  "subtotal": 0,
  "tax_amount": 0,
  "total_amount": 0,
  "currency": "",
  "line_items": [
    {
      "item_code": "",
      "description": "",
      "quantity": 0,
      "unit_price": 0,
      "line_total": 0
    }
  ]
}`,

  'receipt-extraction': `You are an expert AI assistant specialized in extracting structured data from receipt documents. Extract the following information and return it in JSON format:

REQUIRED FIELDS:
- receipt_number: String
- merchant_name: String
- merchant_address: String
- transaction_date: Date (YYYY-MM-DD format)
- subtotal: Number
- tax_amount: Number
- total_amount: Number
- currency: String
- payment_method: String

LINE ITEMS (as array):
- description: String
- quantity: Number
- unit_price: Number
- line_total: Number

Return JSON in this exact format:
{
  "receipt_number": "",
  "merchant_name": "",
  "merchant_address": "",
  "transaction_date": "",
  "subtotal": 0,
  "tax_amount": 0,
  "total_amount": 0,
  "currency": "",
  "payment_method": "",
  "line_items": [
    {
      "description": "",
      "quantity": 0,
      "unit_price": 0,
      "line_total": 0
    }
  ]
}`,

  'contract-extraction': `You are an expert AI assistant specialized in extracting structured data from contract documents. Extract the following information and return it in JSON format:

REQUIRED FIELDS:
- contract_number: String
- contract_title: String
- party_1_name: String
- party_2_name: String
- contract_date: Date (YYYY-MM-DD format)
- start_date: Date (YYYY-MM-DD format)
- end_date: Date (YYYY-MM-DD format)
- contract_value: Number
- currency: String
- payment_terms: String
- key_obligations: Array of strings

Return JSON in this exact format:
{
  "contract_number": "",
  "contract_title": "",
  "party_1_name": "",
  "party_2_name": "",
  "contract_date": "",
  "start_date": "",
  "end_date": "",
  "contract_value": 0,
  "currency": "",
  "payment_terms": "",
  "key_obligations": []
}`,

  'general-ocr': `You are an expert OCR assistant. Read this scanned document image and extract clean, structured text.
You are also an expert in extracting tables from scanned images.

Instructions:
- Extract all clear tabular structures from the image
- Extract all possible tabular structures with data from the image
- Extract the headings of the table
- Avoid any logos or text not part of a structured table
- Output JSON only in the format:

{
  "tables": [
    {
      "title": "extracted heading",
      "headers": ["Column A", "Column B"],
      "rows": [
        ["value1", "value2"]
      ]
    }
  ]
}`
};

export const ExtractionConfig: React.FC<ExtractionConfigProps> = ({
  step,
  onConfigUpdate
}) => {
  // Get current document type to set appropriate prompt
  const currentType = step.config.processingConfig?.type || 'general-ocr';
  
  // Update prompt when document type changes
  React.useEffect(() => {
    if (currentType in EXTRACTION_PROMPTS) {
      onConfigUpdate('ocrSettings', {
        ...step.config.ocrSettings,
        customPrompt: EXTRACTION_PROMPTS[currentType as keyof typeof EXTRACTION_PROMPTS]
      });
    }
  }, [currentType, onConfigUpdate]);

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
            rows={8}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Pre-filled with optimized prompts based on document type. Customize as needed.
          </p>
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
            <li>• Enhanced Resolution: {step.config.ocrSettings?.enhanceResolution ? 'Yes' : 'No'}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
