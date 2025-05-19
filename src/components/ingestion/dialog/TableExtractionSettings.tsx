
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProcessingOptions } from '@/types/processing';
import { Textarea } from '@/components/ui/textarea';

interface TableExtractionSettingsProps {
  processingOptions: ProcessingOptions;
  setProcessingOptions: React.Dispatch<React.SetStateAction<ProcessingOptions>>;
}

const predefinedPrompts = [
  {
    id: 'default',
    name: 'Default Table Extraction',
    value: `You're an OCR assistant. Read this scanned document image and extract clean, structured text.
You are also an expert in extracting tables from scanned images.
If the image has Checks, Mention that it is a check image and extract the values accordingly.
- Give appropriate title for the image according to the type of image.
Instructions:
- Extract all clear tabular structures from the image.
- Extract all possible tabular structures with data from the image
- Extract the Headings of the table {extracted heading}
- Avoid any logos or text not part of a structured table.
- Output JSON only in the format:

\`\`\`json
{
  "tables": [
    {
      "title": "extracted heading",
      "headers": ["Column A", "Column B"],
      "rows": [
        ["value1", "value2"],
        ...
      ]
    }
  ]
}
\`\`\``
  },
  {
    id: 'financial',
    name: 'Financial Tables',
    value: `You're an OCR assistant specialized in financial documents. Extract tables from this financial document.
Instructions:
- Focus on numeric data, dates, and financial categories
- Extract all clear tabular structures from the image with special attention to financial data
- Give a descriptive title to each table based on its content
- Output JSON only in the format:

\`\`\`json
{
  "tables": [
    {
      "title": "Financial Table Title",
      "headers": ["Date", "Description", "Amount", "Category"],
      "rows": [
        ["2023-01-15", "Office Supplies", "$120.50", "Expenses"],
        ...
      ]
    }
  ]
}
\`\`\``
  },
  {
    id: 'bank',
    name: 'Bank Transactions',
    value: `Extract structured transactions from the bank statement.

Instructions:
- There may be several tables with in the document.
- Combine them into single table
 
**STRICT RULES:**
- Do **NOT** modify transaction descriptions.
- Return **pure JSON output** ONLY. No explanations, no additional text.
 
**Statement Text:**
{text}
 
**Output Format (ONLY JSON)**
\`\`\`json
{
  "tables": [
    {
      "title": "Bank Transactions",
      "headers": ["Date", "Description", "Deposits_Credits", "Withdrawals_Debits"],
      "rows": [
        ["MM/DD/YYYY", "transaction details", "number", "number"],
        ["MM/DD/YYYY", "another transaction", "number", "number"]
      ]
    }
  ]
}
\`\`\``
  },
  {
    id: 'custom',
    name: 'Custom Prompt',
    value: ''
  }
];

export const TableExtractionSettings: React.FC<TableExtractionSettingsProps> = ({ 
  processingOptions,
  setProcessingOptions
}) => {
  const ocrEnabled = processingOptions.ocrSettings?.enabled || false;
  const enhanceResolution = processingOptions.ocrSettings?.enhanceResolution || false;
  const selectedPromptId = processingOptions.ocrSettings?.promptId || 'default';
  const customPrompt = processingOptions.ocrSettings?.customPrompt || '';
  
  const handleOcrToggle = (checked: boolean) => {
    setProcessingOptions(prev => ({
      ...prev,
      ocrSettings: {
        ...prev.ocrSettings,
        enabled: checked
      }
    }));
  };
  
  const handleEnhanceToggle = (checked: boolean) => {
    setProcessingOptions(prev => ({
      ...prev,
      ocrSettings: {
        ...prev.ocrSettings,
        enhanceResolution: checked
      }
    }));
  };
  
  const handlePromptChange = (promptId: string) => {
    const selectedPrompt = predefinedPrompts.find(p => p.id === promptId);
    
    setProcessingOptions(prev => ({
      ...prev,
      ocrSettings: {
        ...prev.ocrSettings,
        promptId: promptId,
        customPrompt: selectedPrompt && promptId !== 'custom' ? selectedPrompt.value : prev.ocrSettings?.customPrompt
      }
    }));
  };
  
  const handleCustomPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProcessingOptions(prev => ({
      ...prev,
      ocrSettings: {
        ...prev.ocrSettings,
        customPrompt: e.target.value
      }
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="ocr-toggle" 
          checked={ocrEnabled} 
          onCheckedChange={handleOcrToggle}
        />
        <Label htmlFor="ocr-toggle">Enable OCR for scanned documents</Label>
      </div>
      
      {ocrEnabled && (
        <>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="enhance-toggle" 
              checked={enhanceResolution} 
              onCheckedChange={handleEnhanceToggle}
            />
            <Label htmlFor="enhance-toggle">Enhance resolution for better results</Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="prompt-select">Select Extraction Prompt</Label>
            <Select value={selectedPromptId} onValueChange={handlePromptChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a prompt" />
              </SelectTrigger>
              <SelectContent>
                {predefinedPrompts.map((prompt) => (
                  <SelectItem key={prompt.id} value={prompt.id}>{prompt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedPromptId === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="custom-prompt">Custom Extraction Prompt</Label>
              <Textarea 
                id="custom-prompt"
                placeholder="Enter your custom prompt for table extraction..."
                className="min-h-[150px]"
                value={customPrompt}
                onChange={handleCustomPromptChange}
              />
              <p className="text-xs text-muted-foreground">
                Include instructions for extracting tables in JSON format with headers and rows.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
