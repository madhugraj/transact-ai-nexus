import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronRight, Table as TableIcon, Database, Download, Edit, Check, FileText } from 'lucide-react';
import ExtractedTablePreview from './ExtractedTablePreview';
import DocumentPreview from './DocumentPreview';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';

interface TablePostProcessingWorkflowProps {
  processingId?: string;
  fileId?: string; 
  tableName?: string;
  onClose: () => void;
  onViewInDatabase?: () => void;
  processingResults?: any;
}

const TablePostProcessingWorkflow: React.FC<TablePostProcessingWorkflowProps> = ({ 
  processingId,
  fileId,
  tableName = 'extracted_table',
  onClose,
  onViewInDatabase,
  processingResults
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'preview' | 'validate' | 'complete'>('preview');
  const [activeTab, setActiveTab] = useState('document');
  const [isEditing, setIsEditing] = useState(false);
  const [tableData, setTableData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);

  console.log("TablePostProcessingWorkflow - processingResults:", processingResults);
  console.log("TablePostProcessingWorkflow - fileId:", fileId);
  console.log("TablePostProcessingWorkflow - processingId:", processingId);

  // Load table data and file information from processing results
  useEffect(() => {
    if (processingResults) {
      console.log("Processing results for table workflow:", {
        hasTableData: Boolean(processingResults.tableData),
        hasExtractedTables: Boolean(processingResults.extractedTables),
        hasFileObjects: Boolean(processingResults.fileObjects && processingResults.fileObjects.length)
      });
      
      // Extract table data from processing results
      if (processingResults.tableData) {
        setTableData(processingResults.tableData);
        setIsLoading(false);
      } else if (processingResults.extractedTables && processingResults.extractedTables.length > 0) {
        const firstTable = processingResults.extractedTables[0];
        setTableData({
          headers: firstTable.headers,
          rows: firstTable.rows,
          metadata: {
            totalRows: firstTable.rows.length,
            confidence: firstTable.confidence || 0.9,
            sourceFile: fileId || processingId || ""
          }
        });
        setIsLoading(false);
      }
      
      // Extract file for document preview
      if (processingResults.fileObjects && processingResults.fileObjects.length > 0) {
        const file = processingResults.fileObjects[0];
        setFileUrl(URL.createObjectURL(file));
        setFileName(file.name);
        setFileType(file.type);
        console.log("Created file URL for preview:", file.name, file.type);
      }
    } else if (fileId) {
      // Fallback to API if no processing results but we have a fileId
      loadTableData();
    } else {
      setIsLoading(false);
      setError("No table data or file ID provided");
    }
  }, [processingResults, fileId]);

  // Load table data from API if not provided in processing results
  const loadTableData = async () => {
    if (!fileId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.getTablePreview(fileId);
      
      if (!response.success) {
        setError(response.error || 'Failed to load table data');
        toast({
          title: "Error loading table",
          description: response.error,
          variant: "destructive",
        });
      } else {
        setTableData(response.data || null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Error loading table",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle export
  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (!fileId) {
      toast({
        title: "Export error",
        description: "No file to export",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.exportTableData(fileId, format);
      
      if (!response.success) {
        toast({
          title: "Export failed",
          description: response.error,
          variant: "destructive",
        });
        return;
      }
      
      // Create download link from the blob data
      if (response.data instanceof Blob) {
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${tableName}.${format === 'csv' ? 'csv' : 'xlsx'}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        toast({
          title: "Export successful",
          description: `Table exported as ${format.toUpperCase()}`,
        });
      } else {
        toast({
          title: "Export error",
          description: "Invalid export data format",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Export error",
        description: error instanceof Error ? error.message : 'Unknown error during export',
        variant: "destructive",
      });
    }
  };

  // Get steps for the current workflow
  const getSteps = () => [
    { id: 'preview', label: 'Preview', status: currentStep === 'preview' ? 'active' : (currentStep === 'validate' || currentStep === 'complete' ? 'complete' : 'pending') },
    { id: 'validate', label: 'Validate', status: currentStep === 'validate' ? 'active' : (currentStep === 'complete' ? 'complete' : 'pending') },
    { id: 'complete', label: 'Complete', status: currentStep === 'complete' ? 'active' : 'pending' }
  ];

  return (
    <Card className="shadow-lg border-primary/20">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <TableIcon className="h-5 w-5 text-primary" />
            Table Extraction Complete
            {tableName && (
              <Badge variant="outline" className="ml-2 text-xs">
                {tableName}
              </Badge>
            )}
          </CardTitle>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center mt-4">
          {getSteps().map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center 
                    ${step.status === 'active' ? 'bg-primary text-primary-foreground' : 
                      step.status === 'complete' ? 'bg-green-100 text-green-700' : 
                      'bg-muted text-muted-foreground'}`}
                >
                  {step.status === 'complete' ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className={`text-xs mt-1 ${step.status === 'active' ? 'font-medium' : ''}`}>
                  {step.label}
                </span>
              </div>
              
              {index < getSteps().length - 1 && (
                <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
              )}
            </React.Fragment>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <Tabs value={currentStep} className="w-full">
          <TabsContent value="preview" className="mt-0">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Document & Table Preview</h3>
                <Button 
                  onClick={() => setCurrentStep('validate')}
                  className="gap-1"
                  disabled={!tableData && !isLoading}
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Preview tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="document" className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> Document
                  </TabsTrigger>
                  <TabsTrigger value="table" className="flex items-center gap-1">
                    <TableIcon className="h-3.5 w-3.5" /> Extracted Table
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="document" className="mt-0">
                  <DocumentPreview 
                    fileUrl={fileUrl} 
                    fileName={fileName || undefined}
                    fileType={fileType || undefined}
                  />
                </TabsContent>
                
                <TabsContent value="table" className="mt-0">
                  <ExtractedTablePreview 
                    fileId={fileId}
                    initialData={tableData ? { headers: tableData.headers, rows: tableData.rows } : undefined}
                    isLoading={isLoading}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
          
          <TabsContent value="validate" className="mt-0">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Validate Data</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={!tableData}
                  >
                    {isEditing ? 'Done Editing' : (
                      <>
                        <Edit className="h-4 w-4 mr-1" /> Edit Data
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep('complete')}
                    className="gap-1"
                  >
                    Confirm <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {isEditing ? (
                <div className="border rounded-md p-4 bg-muted/30">
                  <p className="text-center text-muted-foreground mb-4">
                    Table editing mode would be implemented here
                  </p>
                  <ExtractedTablePreview 
                    fileId={fileId}
                    initialData={tableData ? { headers: tableData.headers, rows: tableData.rows } : undefined}
                  />
                </div>
              ) : (
                <ExtractedTablePreview 
                  fileId={fileId}
                  initialData={tableData ? { headers: tableData.headers, rows: tableData.rows } : undefined}
                />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="complete" className="mt-0">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Extraction Complete</h3>
                <p className="text-muted-foreground">
                  Your table has been successfully extracted and processed.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onViewInDatabase && onViewInDatabase()}
                >
                  <Database className="mr-2 h-4 w-4" />
                  View in Database
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => fileId && handleExport('csv')}
                  disabled={!fileId}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </div>
              
              <div className="pt-4 border-t">
                <Button 
                  onClick={onClose}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TablePostProcessingWorkflow;
