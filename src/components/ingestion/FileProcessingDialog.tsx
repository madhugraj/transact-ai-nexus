
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Settings, TableIcon, FileText, Layers, Sparkles, Database, ArrowRight, Eye, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentProcessingInterface } from '../processing/agent-processing/AgentProcessingInterface';
import { PostProcessAction, ProcessingOptions } from '@/types/processing';

// Defines file status used in the component
type FileStatus = 'idle' | 'uploading' | 'success' | 'error';

// Interface for the uploaded file with status and progress
interface UploadedFile {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
  processed?: boolean;
  backendId?: string;
}

interface FileProcessingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFileIds: string[];
  files: UploadedFile[];
  currentAction: PostProcessAction;
  setCurrentAction: (action: PostProcessAction) => void;
  processingOptions: ProcessingOptions;
  setProcessingOptions: React.Dispatch<React.SetStateAction<ProcessingOptions>>;
  onProcess: () => void;
  isDocumentFile: (file: File) => boolean;
  isDataFile: (file: File) => boolean;
}

export const FileProcessingDialog: React.FC<FileProcessingDialogProps> = ({
  open,
  onOpenChange,
  selectedFileIds,
  files,
  currentAction,
  setCurrentAction,
  processingOptions,
  setProcessingOptions,
  onProcess,
  isDocumentFile,
  isDataFile
}) => {
  // Get selected files
  const selectedFiles = files.filter(file => selectedFileIds.includes(file.id));
  const selectedFileObjects = selectedFiles.map(f => f.file);
  
  // Auto-detect processing type based on file types
  React.useEffect(() => {
    if (selectedFiles.length > 0) {
      const hasDocuments = selectedFiles.some(f => isDocumentFile(f.file));
      const hasDataFiles = selectedFiles.some(f => isDataFile(f.file));
      
      // Check if files look like POs (PDF/images with PO-related names)
      const hasPOFiles = selectedFiles.some(f => 
        isDocumentFile(f.file) && 
        (f.file.name.toLowerCase().includes('po') || 
         f.file.name.toLowerCase().includes('purchase') ||
         f.file.name.toLowerCase().includes('order'))
      );
      
      if (hasPOFiles) {
        setCurrentAction('po_processing' as PostProcessAction);
      } else if (hasDocuments && !hasDataFiles) {
        setCurrentAction('table_extraction');
      } else if (hasDataFiles) {
        setCurrentAction('table_extraction');
      }
    }
  }, [selectedFiles, isDocumentFile, isDataFile, setCurrentAction]);

  // Helper to get friendly name for actions
  const getActionName = (action: PostProcessAction): string => {
    switch (action) {
      case 'table_extraction': return 'Table Extraction';
      case 'insights': return 'Generate Insights';
      case 'summary': return 'Document Summary';
      case 'combine_data': return 'Combine Data';
      case 'push_to_db': return 'Push to Database';
      default: return action;
    }
  };

  const handleProcessClick = () => {
    if (currentAction === 'po_processing') {
      // For PO processing, we don't need the regular process flow
      // The AgentProcessingInterface will handle it
      return;
    } else {
      // For other processing types, use the regular flow
      onProcess();
    }
  };

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

        {/* Database Settings for push_to_db action */}
        {currentAction === 'push_to_db' && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
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
          </>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Files</DialogTitle>
          <DialogDescription>
            Choose how to process your {selectedFiles.length} selected file(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Processing Action</Label>
            <div className="grid grid-cols-2 gap-3">
              {/* Table Extraction */}
              <div 
                className={cn(
                  "border rounded-lg p-3 cursor-pointer transition-all",
                  currentAction === 'table_extraction' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
                onClick={() => setCurrentAction('table_extraction')}
              >
                <div className="flex items-center space-x-2">
                  <TableIcon className="h-5 w-5" />
                  <span className="font-medium">Table Extraction</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Extract structured data from documents
                </p>
              </div>

              {/* PO Processing */}
              <div 
                className={cn(
                  "border rounded-lg p-3 cursor-pointer transition-all",
                  currentAction === 'po_processing' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
                onClick={() => setCurrentAction('po_processing' as PostProcessAction)}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">PO Processing</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Extract and process Purchase Order data
                </p>
              </div>

              {/* Other actions... */}
              <div 
                className={cn(
                  "border rounded-lg p-3 cursor-pointer transition-all",
                  currentAction === 'insights' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
                onClick={() => setCurrentAction('insights')}
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-medium">Generate Insights</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  AI-powered data analysis
                </p>
              </div>

              <div 
                className={cn(
                  "border rounded-lg p-3 cursor-pointer transition-all",
                  currentAction === 'push_to_db' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
                onClick={() => setCurrentAction('push_to_db')}
              >
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span className="font-medium">Push to Database</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Store data in database
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Processing Configuration Tabs */}
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="w-full bg-muted/30 rounded-md">
              <TabsTrigger 
                value="basic" 
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
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 py-4">
              {/* PO Processing Interface */}
              {currentAction === 'po_processing' ? (
                <div className="space-y-4">
                  <AgentProcessingInterface 
                    files={selectedFileObjects}
                    title="Purchase Order Processing"
                    description="AI agents will detect and extract PO data from your documents"
                  />
                </div>
              ) : (
                /* Basic settings for other actions */
                <div className="space-y-4">
                  {currentAction === 'table_extraction' && (
                    <div className="space-y-4">
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
                              value={processingOptions.tableFormat.headerRow || 1}
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
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="normalize-data"
                          checked={processingOptions.dataProcessing?.normalizeData || false}
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
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="advanced" className="py-4">
              {renderAdvancedSettings()}
            </TabsContent>
          </Tabs>

          {/* Action Buttons - only show for non-PO processing */}
          {currentAction !== 'po_processing' && (
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleProcessClick} className="gap-2">
                <ArrowRight className="h-4 w-4" />
                Start {getActionName(currentAction)}
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Re-export types for compatibility
export type { PostProcessAction, ProcessingOptions };
