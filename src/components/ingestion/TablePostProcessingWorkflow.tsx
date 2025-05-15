
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
import { WorkflowSteps } from './workflow/WorkflowSteps';
import { PreviewTab } from './workflow/PreviewTab';
import { ValidateTab } from './workflow/ValidateTab';
import { CompleteTab } from './workflow/CompleteTab';

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
  const [tableData, setTableData] = useState<api.TableData | null>(null);
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
        link.setAttribute('download', `${tableName}.${format}`);
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
    { 
      id: 'preview', 
      label: 'Preview', 
      status: currentStep === 'preview' ? 'active' as const : (currentStep === 'validate' || currentStep === 'complete' ? 'complete' as const : 'pending' as const) 
    },
    { 
      id: 'validate', 
      label: 'Validate', 
      status: currentStep === 'validate' ? 'active' as const : (currentStep === 'complete' ? 'complete' as const : 'pending' as const) 
    },
    { 
      id: 'complete', 
      label: 'Complete', 
      status: currentStep === 'complete' ? 'active' as const : 'pending' as const 
    }
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
        
        <WorkflowSteps steps={getSteps()} />
      </CardHeader>
      
      <CardContent className="p-6">
        <Tabs value={currentStep} className="w-full">
          <TabsContent value="preview" className="mt-0">
            <PreviewTab 
              tableData={tableData} 
              isLoading={isLoading} 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              fileUrl={fileUrl}
              fileName={fileName}
              fileType={fileType}
              fileId={fileId}
              onContinue={() => setCurrentStep('validate')}
            />
          </TabsContent>
          
          <TabsContent value="validate" className="mt-0">
            <ValidateTab
              tableData={tableData}
              fileId={fileId}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              onContinue={() => setCurrentStep('complete')}
            />
          </TabsContent>
          
          <TabsContent value="complete" className="mt-0">
            <CompleteTab
              fileId={fileId}
              onViewInDatabase={onViewInDatabase}
              handleExport={handleExport}
              onClose={onClose}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TablePostProcessingWorkflow;
