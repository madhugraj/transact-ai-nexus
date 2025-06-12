
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

// Pre-written prompts based on document types
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
- po_number: String (CRITICAL - Look for "P.O:", "PO Number:", "Order No:", etc.)
- payment_terms: String

CRITICAL PO NUMBER EXTRACTION:
The Purchase Order (PO) number is ABSOLUTELY CRITICAL. Look for:
- "P.O:" followed by a number (like "P.O: 25260168")
- "P.O." or "PO Number:" or "Order No:" followed by a number
- ANY field that contains purchase order references
- Check EVERY section: header, bill-to area, footer, tables
- Extract the EXACT number after these labels
- Remove prefixes like "P.O:", keep only the actual number

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
  const currentType = step.config.processingConfig?.type || 'general-ocr';
  const currentPrompt = step.config.ocrSettings?.customPrompt || '';

  // Initialize with default prompt if empty
  React.useEffect(() => {
    if (!currentPrompt && currentType in EXTRACTION_PROMPTS) {
      console.log('🔧 Initializing extraction prompt for type:', currentType);
      onConfigUpdate('ocrSettings', {
        ...step.config.ocrSettings,
        customPrompt: EXTRACTION_PROMPTS[currentType as keyof typeof EXTRACTION_PROMPTS]
      });
    }
  }, [currentType, currentPrompt, onConfigUpdate]);

  const handlePromptChange = (newPrompt: string) => {
    console.log('📝 Updating custom extraction prompt, length:', newPrompt.length);
    onConfigUpdate('ocrSettings', {
      ...step.config.ocrSettings,
      customPrompt: newPrompt
    });
  };

  const handleTypeChange = (newType: string) => {
    console.log('🔄 Changing extraction type to:', newType);
    onConfigUpdate('processingConfig', {
      ...step.config.processingConfig,
      type: newType
    });
    
    // Update prompt when type changes
    if (newType in EXTRACTION_PROMPTS) {
      handlePromptChange(EXTRACTION_PROMPTS[newType as keyof typeof EXTRACTION_PROMPTS]);
    }
  };

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
            value={currentType}
            onValueChange={handleTypeChange}
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
              <SelectItem value="gemini">Gemini Vision AI</SelectItem>
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
          <Label className="flex items-center justify-between">
            Custom Extraction Prompt
            <Badge variant="outline" className="text-xs">
              {currentPrompt.length} chars
            </Badge>
          </Label>
          <Textarea
            value={currentPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="Enter specific instructions for data extraction..."
            rows={12}
            className="font-mono text-sm"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              Customize the AI prompt for better extraction accuracy
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentType in EXTRACTION_PROMPTS) {
                  handlePromptChange(EXTRACTION_PROMPTS[currentType as keyof typeof EXTRACTION_PROMPTS]);
                }
              }}
              className="text-xs"
            >
              Reset to Default
            </Button>
          </div>
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
          <p className="font-medium mb-1">Current Configuration:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Type: {currentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>
            <li>• Method: {step.config.processingConfig?.aiModel || 'Hybrid'}</li>
            <li>• Confidence: {((step.config.processingConfig?.confidence || 0.8) * 100).toFixed(0)}%</li>
            <li>• Language: {step.config.ocrSettings?.language || 'English'}</li>
            <li>• Enhanced Resolution: {step.config.ocrSettings?.enhanceResolution ? 'Yes' : 'No'}</li>
            <li>• Custom Prompt: {currentPrompt ? 'Configured' : 'Default'}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
