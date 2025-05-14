
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, TableIcon, FileText, Layers, Sparkles, Database, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Post-processing action for uploaded files
export type PostProcessAction = 'table_extraction' | 'insights' | 'summary' | 'combine_data' | 'push_to_db';

// File processing options
export interface ProcessingOptions {
  tableFormat?: {
    hasHeaders: boolean;
    headerRow?: number;
    skipRows?: number;
    delimiter?: string;
  };
  dataProcessing?: {
    normalizeData: boolean;
    removeEmptyRows: boolean;
    detectTypes: boolean;
  };
  databaseOptions?: {
    connection: string;
    tableName: string;
    createIfNotExists: boolean;
  };
}

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
  onProcess
}) => {
  // Determine if file is a document (PDF/image) or data file (CSV/Excel)
  const isDocumentFile = (file: File) => {
    return file.type === 'application/pdf' || file.type.startsWith('image/');
  };

  // Determine if file is a data file (CSV/Excel)
  const isDataFile = (file: File) => {
    return file.type.includes('excel') || file.type.includes('spreadsheet') || file.type === 'text/csv';
  };
  
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

  // Render specific options for table extraction
  const renderTableExtractionSettings = () => (
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
    </div>
  );

  // Render specific options for data combining
  const renderDataCombiningSettings = () => (
    <div className="space-y-4">
      <div>
        <Label>Combine Method</Label>
        <Select defaultValue="append">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="append">Append (stack vertically)</SelectItem>
            <SelectItem value="merge">Merge on common columns</SelectItem>
            <SelectItem value="union">Union (distinct rows)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Match Columns</Label>
        <Select defaultValue="auto">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto-detect columns</SelectItem>
            <SelectItem value="name">Match by column name</SelectItem>
            <SelectItem value="position">Match by position</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox id="remove-empty-rows" defaultChecked />
        <label htmlFor="remove-empty-rows" className="text-sm">
          Remove empty rows
        </label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox id="normalize-combined-data" defaultChecked />
        <label htmlFor="normalize-combined-data" className="text-sm">
          Normalize column names across files
        </label>
      </div>
    </div>
  );

  // Render specific options for database push
  const renderDatabasePushSettings = () => (
    <div className="space-y-4">
      <div>
        <Label>Database Connection</Label>
        <Select 
          value={processingOptions.databaseOptions?.connection}
          onValueChange={(val) => setProcessingOptions(prev => ({
            ...prev,
            databaseOptions: {
              ...prev.databaseOptions,
              connection: val
            }
          }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ERP Database">ERP Database (PostgreSQL)</SelectItem>
            <SelectItem value="SAP HANA">SAP HANA</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Table Name</Label>
        <Input 
          placeholder="Enter table name" 
          value={processingOptions.databaseOptions?.tableName}
          onChange={(e) => setProcessingOptions(prev => ({
            ...prev,
            databaseOptions: {
              ...prev.databaseOptions,
              tableName: e.target.value
            }
          }))}
        />
        <p className="text-xs text-muted-foreground">
          Name of the table to store the data
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="create-table"
          checked={processingOptions.databaseOptions?.createIfNotExists}
          onCheckedChange={(checked) => setProcessingOptions(prev => ({
            ...prev,
            databaseOptions: {
              ...prev.databaseOptions,
              createIfNotExists: checked === true
            }
          }))}
        />
        <label htmlFor="create-table" className="text-sm">
          Create table if it doesn't exist
        </label>
      </div>
      
      <div className="space-y-2">
        <Label>Insert Method</Label>
        <Select defaultValue="insert">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="insert">Insert new rows</SelectItem>
            <SelectItem value="upsert">Upsert (update if exists)</SelectItem>
            <SelectItem value="replace">Replace table contents</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Render specific options for insights
  const renderInsightSettings = () => (
    <div className="space-y-4">
      <div>
        <Label>Analysis Type</Label>
        <Select defaultValue="standard">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard Analysis</SelectItem>
            <SelectItem value="financial">Financial Analysis</SelectItem>
            <SelectItem value="detailed">Detailed Breakdown</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Key Metrics</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="metric-amounts" defaultChecked />
            <label htmlFor="metric-amounts" className="text-sm">Amount Analysis</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="metric-dates" defaultChecked />
            <label htmlFor="metric-dates" className="text-sm">Date Patterns</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="metric-vendors" defaultChecked />
            <label htmlFor="metric-vendors" className="text-sm">Vendor Analysis</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="metric-category" defaultChecked />
            <label htmlFor="metric-category" className="text-sm">Category Detection</label>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Visualization Options</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="viz-charts" defaultChecked />
            <label htmlFor="viz-charts" className="text-sm">Generate Charts</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="viz-summary" defaultChecked />
            <label htmlFor="viz-summary" className="text-sm">Summary Tables</label>
          </div>
        </div>
      </div>
    </div>
  );

  // Render specific options for document summary
  const renderDocumentSummarySettings = () => (
    <div className="space-y-4">
      <div>
        <Label>Summary Type</Label>
        <Select defaultValue="comprehensive">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="brief">Brief Overview</SelectItem>
            <SelectItem value="comprehensive">Comprehensive</SelectItem>
            <SelectItem value="financial">Financial Focus</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Include Elements</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="elem-metadata" defaultChecked />
            <label htmlFor="elem-metadata" className="text-sm">Document Metadata</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="elem-entities" defaultChecked />
            <label htmlFor="elem-entities" className="text-sm">Named Entities</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="elem-tables" defaultChecked />
            <label htmlFor="elem-tables" className="text-sm">Tables</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="elem-amounts" defaultChecked />
            <label htmlFor="elem-amounts" className="text-sm">Monetary Amounts</label>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox id="extract-key-terms" defaultChecked />
        <label htmlFor="extract-key-terms" className="text-sm">
          Extract key terms and concepts
        </label>
      </div>
    </div>
  );

  // Render appropriate settings based on current action
  const renderActionSettings = () => {
    switch (currentAction) {
      case 'table_extraction':
        return renderTableExtractionSettings();
      case 'combine_data':
        return renderDataCombiningSettings();
      case 'push_to_db':
        return renderDatabasePushSettings();
      case 'insights':
        return renderInsightSettings();
      case 'summary':
        return renderDocumentSummarySettings();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Process Files</DialogTitle>
          <DialogDescription>
            {selectedFileIds.length} file(s) selected for processing
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Select Action</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {selectedFileIds.length > 0 && isDocumentFile(files.find(f => f.id === selectedFileIds[0])?.file as File) && (
                  <>
                    <div
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer hover:bg-muted/50",
                        currentAction === 'table_extraction' && "border-primary bg-primary/5"
                      )}
                      onClick={() => setCurrentAction('table_extraction')}
                    >
                      <TableIcon className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-sm font-medium">Table Extraction</span>
                    </div>
                    <div
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer hover:bg-muted/50",
                        currentAction === 'summary' && "border-primary bg-primary/5"
                      )}
                      onClick={() => setCurrentAction('summary')}
                    >
                      <FileText className="h-8 w-8 mb-2 text-orange-500" />
                      <span className="text-sm font-medium">Document Summary</span>
                    </div>
                  </>
                )}

                {selectedFileIds.length > 0 && isDataFile(files.find(f => f.id === selectedFileIds[0])?.file as File) && selectedFileIds.length > 1 && (
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer hover:bg-muted/50",
                      currentAction === 'combine_data' && "border-primary bg-primary/5"
                    )}
                    onClick={() => setCurrentAction('combine_data')}
                  >
                    <Layers className="h-8 w-8 mb-2 text-blue-500" />
                    <span className="text-sm font-medium">Combine Data</span>
                  </div>
                )}

                <div
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer hover:bg-muted/50",
                    currentAction === 'insights' && "border-primary bg-primary/5"
                  )}
                  onClick={() => setCurrentAction('insights')}
                >
                  <Sparkles className="h-8 w-8 mb-2 text-yellow-500" />
                  <span className="text-sm font-medium">Generate Insights</span>
                </div>
                
                <div
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer hover:bg-muted/50",
                    currentAction === 'push_to_db' && "border-primary bg-primary/5"
                  )}
                  onClick={() => setCurrentAction('push_to_db')}
                >
                  <Database className="h-8 w-8 mb-2 text-green-500" />
                  <span className="text-sm font-medium">Push to Database</span>
                </div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            {/* Action-specific settings */}
            <Tabs defaultValue="settings">
              <TabsList>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="settings" className="space-y-4 py-4">
                {renderActionSettings()}
              </TabsContent>
              
              <TabsContent value="preview">
                <div className="p-6 text-center text-muted-foreground border rounded-md flex flex-col items-center justify-center h-40 mt-2">
                  <Settings className="h-8 w-8 mb-2 opacity-50" />
                  <p>Preview will be generated after processing begins</p>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Next Steps Workflow */}
            <div className="bg-muted p-4 rounded-md mt-4">
              <h4 className="text-sm font-medium mb-2">Processing Workflow</h4>
              <div className="flex items-center text-sm">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    1
                  </div>
                  <span className="text-xs mt-1">Process</span>
                </div>
                <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center">
                    2
                  </div>
                  <span className="text-xs mt-1">Dashboard</span>
                </div>
                <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center">
                    3
                  </div>
                  <span className="text-xs mt-1">AI Assistant</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onProcess}>
            Start Processing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
