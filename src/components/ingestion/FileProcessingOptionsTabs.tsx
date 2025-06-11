
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Eye, FileText, Sliders } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProcessingOptions, PostProcessAction } from '@/types/processing';
import { ProcessingWorkflow } from './dialog/ProcessingWorkflow';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

interface FileProcessingOptionsTabsProps {
  currentAction: PostProcessAction;
  processingOptions: ProcessingOptions;
  setProcessingOptions: React.Dispatch<React.SetStateAction<ProcessingOptions>>;
  renderActionSettings: () => React.ReactNode;
  previewContent?: React.ReactNode;
}

const FileProcessingOptionsTabs: React.FC<FileProcessingOptionsTabsProps> = ({
  currentAction,
  processingOptions,
  setProcessingOptions,
  renderActionSettings,
  previewContent
}) => {
  const renderAdvancedSettings = () => {
    return (
      <div className="space-y-6">
        {/* OCR Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <Label className="text-base font-medium">OCR Settings</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="enable-ocr"
                checked={processingOptions.ocrSettings?.enabled || false}
                onCheckedChange={(checked) => setProcessingOptions(prev => ({
                  ...prev,
                  ocrSettings: {
                    ...prev.ocrSettings,
                    enabled: checked === true
                  }
                }))}
              />
              <label htmlFor="enable-ocr" className="text-sm">
                Enable OCR processing
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="enhance-resolution"
                checked={processingOptions.ocrSettings?.enhanceResolution || false}
                onCheckedChange={(checked) => setProcessingOptions(prev => ({
                  ...prev,
                  ocrSettings: {
                    ...prev.ocrSettings,
                    enhanceResolution: checked === true
                  }
                }))}
              />
              <label htmlFor="enhance-resolution" className="text-sm">
                Enhance image resolution
              </label>
            </div>
          </div>

          <div>
            <Label>OCR Language</Label>
            <Select 
              value={processingOptions.ocrSettings?.language || 'eng'}
              onValueChange={(value) => setProcessingOptions(prev => ({
                ...prev,
                ocrSettings: {
                  ...prev.ocrSettings,
                  language: value
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
                <SelectItem value="chi_sim">Chinese (Simplified)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Custom OCR Prompt</Label>
            <Textarea 
              value={processingOptions.ocrSettings?.customPrompt || ''}
              onChange={(e) => setProcessingOptions(prev => ({
                ...prev,
                ocrSettings: {
                  ...prev.ocrSettings,
                  customPrompt: e.target.value
                }
              }))}
              placeholder="Enter custom instructions for OCR processing..."
              rows={4}
            />
          </div>
        </div>

        <Separator />

        {/* Extraction Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            <Label className="text-base font-medium">Extraction Settings</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
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
            </div>
            
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox 
                id="retain-formatting"
                checked={processingOptions.extractionOptions?.retainFormatting || false}
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
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="detect-multiple-tables"
              checked={processingOptions.extractionOptions?.detectMultipleTables || false}
              onCheckedChange={(checked) => setProcessingOptions(prev => ({
                ...prev,
                extractionOptions: {
                  ...prev.extractionOptions,
                  detectMultipleTables: checked === true
                }
              }))}
            />
            <label htmlFor="detect-multiple-tables" className="text-sm">
              Detect multiple tables in document
            </label>
          </div>
        </div>

        {/* Database Settings */}
        <Separator />
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <Label className="text-base font-medium">Database Settings</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Table Name</Label>
              <Input 
                value={processingOptions.databaseOptions?.tableName || ''}
                onChange={(e) => setProcessingOptions(prev => ({
                  ...prev,
                  databaseOptions: {
                    ...prev.databaseOptions,
                    tableName: e.target.value
                  }
                }))}
                placeholder="extracted_data"
              />
            </div>
            
            <div>
              <Label>Connection</Label>
              <Select 
                value={processingOptions.databaseOptions?.connection || 'Default Connection'}
                onValueChange={(value) => setProcessingOptions(prev => ({
                  ...prev,
                  databaseOptions: {
                    ...prev.databaseOptions,
                    connection: value
                  }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Default Connection">Default Connection</SelectItem>
                  <SelectItem value="Production DB">Production DB</SelectItem>
                  <SelectItem value="Staging DB">Staging DB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="create-if-not-exists"
              checked={processingOptions.databaseOptions?.createIfNotExists || false}
              onCheckedChange={(checked) => setProcessingOptions(prev => ({
                ...prev,
                databaseOptions: {
                  ...prev.databaseOptions,
                  createIfNotExists: checked === true
                }
              }))}
            />
            <label htmlFor="create-if-not-exists" className="text-sm">
              Create table if it doesn't exist
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Tabs defaultValue="settings" className="w-full">
      <TabsList className="w-full bg-muted/30 rounded-md">
        <TabsTrigger 
          value="settings" 
          className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <Settings className="h-4 w-4 mr-1" /> Basic Settings
        </TabsTrigger>
        <TabsTrigger 
          value="advanced" 
          className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <Sliders className="h-4 w-4 mr-1" /> Advanced Settings
        </TabsTrigger>
        <TabsTrigger 
          value="preview" 
          className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <Eye className="h-4 w-4 mr-1" /> Preview
        </TabsTrigger>
        <TabsTrigger 
          value="workflow" 
          className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <FileText className="h-4 w-4 mr-1" /> Workflow
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="settings" className="space-y-4 py-4">
        {renderActionSettings()}
      </TabsContent>
      
      <TabsContent value="advanced" className="py-4">
        {renderAdvancedSettings()}
      </TabsContent>
      
      <TabsContent value="preview">
        {previewContent ? (
          <div className="pt-4">{previewContent}</div>
        ) : (
          <div className="p-6 text-center text-muted-foreground border rounded-md flex flex-col items-center justify-center min-h-[200px] mt-2 bg-muted/10">
            <Eye className="h-8 w-8 mb-2 opacity-50" />
            <p>Preview will be generated after processing begins</p>
            <div className="mt-4 space-y-2 w-full max-w-sm">
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6 mx-auto" />
            </div>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="workflow">
        <div className="py-4">
          <ProcessingWorkflow />
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default FileProcessingOptionsTabs;
