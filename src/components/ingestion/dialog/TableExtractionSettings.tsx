
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ProcessingOptions } from '@/types/processing';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TableExtractionSettingsProps {
  processingOptions: ProcessingOptions;
  setProcessingOptions: React.Dispatch<React.SetStateAction<ProcessingOptions>>;
}

export const TableExtractionSettings: React.FC<TableExtractionSettingsProps> = ({ 
  processingOptions, 
  setProcessingOptions 
}) => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="table">Table Options</TabsTrigger>
          <TabsTrigger value="ocr">OCR Settings</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Table Headers</Label>
              <Select 
                value={processingOptions.tableFormat?.hasHeaders ? "yes" : "no"}
                onValueChange={(val) => setProcessingOptions(prev => ({
                  ...prev,
                  tableFormat: {
                    ...prev.tableFormat,
                    hasHeaders: val === "yes"
                  }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">First row is header</SelectItem>
                  <SelectItem value="no">No headers in table</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {processingOptions.tableFormat?.hasHeaders && (
              <div>
                <Label>Header Row</Label>
                <Input 
                  type="number" 
                  min="1" 
                  value={processingOptions.tableFormat.headerRow}
                  onChange={(e) => setProcessingOptions(prev => ({
                    ...prev,
                    tableFormat: {
                      ...prev.tableFormat,
                      headerRow: parseInt(e.target.value)
                    }
                  }))}
                />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Skip Rows</Label>
            <Input 
              type="number" 
              min="0"
              value={processingOptions.tableFormat?.skipRows}
              onChange={(e) => setProcessingOptions(prev => ({
                ...prev,
                tableFormat: {
                  ...prev.tableFormat,
                  skipRows: parseInt(e.target.value)
                }
              }))}
            />
            <p className="text-xs text-muted-foreground">
              Number of rows to skip from the top of the document
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="normalize-data"
              checked={processingOptions.dataProcessing?.normalizeData}
              onCheckedChange={(checked) => setProcessingOptions(prev => ({
                ...prev,
                dataProcessing: {
                  ...prev.dataProcessing,
                  normalizeData: checked === true
                }
              }))}
            />
            <label htmlFor="normalize-data" className="text-sm">
              Normalize extracted data
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="detect-types"
              checked={processingOptions.dataProcessing?.detectTypes}
              onCheckedChange={(checked) => setProcessingOptions(prev => ({
                ...prev,
                dataProcessing: {
                  ...prev.dataProcessing,
                  detectTypes: checked === true
                }
              }))}
            />
            <label htmlFor="detect-types" className="text-sm">
              Auto-detect data types
            </label>
          </div>
        </TabsContent>

        <TabsContent value="ocr" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="enable-ocr"
              checked={processingOptions.ocrOptions?.enabled}
              onCheckedChange={(checked) => setProcessingOptions(prev => ({
                ...prev,
                ocrOptions: {
                  ...prev.ocrOptions,
                  enabled: checked === true
                }
              }))}
            />
            <label htmlFor="enable-ocr" className="text-sm font-medium">
              Enable OCR for scanned documents
            </label>
          </div>

          {processingOptions.ocrOptions?.enabled && (
            <>
              <div className="flex items-center space-x-2 ml-6">
                <Checkbox 
                  id="enhance-image"
                  checked={processingOptions.ocrOptions?.enhanceImage}
                  onCheckedChange={(checked) => setProcessingOptions(prev => ({
                    ...prev,
                    ocrOptions: {
                      ...prev.ocrOptions,
                      enhanceImage: checked === true
                    }
                  }))}
                />
                <label htmlFor="enhance-image" className="text-sm">
                  Enhance image quality before OCR
                </label>
              </div>

              <div className="ml-6">
                <Label>OCR Language</Label>
                <Select 
                  value={processingOptions.ocrOptions?.language || 'eng'}
                  onValueChange={(val) => setProcessingOptions(prev => ({
                    ...prev,
                    ocrOptions: {
                      ...prev.ocrOptions,
                      language: val
                    }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eng">English</SelectItem>
                    <SelectItem value="fra">French</SelectItem>
                    <SelectItem value="deu">German</SelectItem>
                    <SelectItem value="spa">Spanish</SelectItem>
                    <SelectItem value="multi">Multiple Languages</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <div>
            <Label>Confidence Threshold</Label>
            <Input 
              type="number" 
              min="0" 
              max="1" 
              step="0.1"
              value={processingOptions.extractionOptions?.confidenceThreshold || 0.8}
              onChange={(e) => setProcessingOptions(prev => ({
                ...prev,
                extractionOptions: {
                  ...prev.extractionOptions,
                  confidenceThreshold: parseFloat(e.target.value)
                }
              }))}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum confidence required for table detection (0-1)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="retain-formatting"
              checked={processingOptions.extractionOptions?.retainFormatting}
              onCheckedChange={(checked) => setProcessingOptions(prev => ({
                ...prev,
                extractionOptions: {
                  ...prev.extractionOptions,
                  retainFormatting: checked === true
                }
              }))}
            />
            <label htmlFor="retain-formatting" className="text-sm">
              Retain original formatting
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="detect-multiple"
              checked={processingOptions.extractionOptions?.detectMultipleTables}
              onCheckedChange={(checked) => setProcessingOptions(prev => ({
                ...prev,
                extractionOptions: {
                  ...prev.extractionOptions,
                  detectMultipleTables: checked === true
                }
              }))}
            />
            <label htmlFor="detect-multiple" className="text-sm">
              Detect multiple tables in document
            </label>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
