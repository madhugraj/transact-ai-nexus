
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronRight, Table as TableIcon, Database, Download, Edit, Check } from 'lucide-react';
import ExtractedTablePreview from './ExtractedTablePreview';
import { useToast } from '@/hooks/use-toast';

interface TablePostProcessingWorkflowProps {
  tableName?: string;
  onClose: () => void;
  onViewInDatabase?: () => void;
}

const TablePostProcessingWorkflow: React.FC<TablePostProcessingWorkflowProps> = ({ 
  tableName = 'extracted_table',
  onClose,
  onViewInDatabase
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'preview' | 'validate' | 'complete'>('preview');
  const [isEditing, setIsEditing] = useState(false);
  
  // Sample data for demonstration
  const mockHeaders = ['Invoice Number', 'Date', 'Customer', 'Amount', 'Status'];
  const mockData = [
    ['INV-001', '2023-05-10', 'Acme Corp', '$1,200.00', 'Paid'],
    ['INV-002', '2023-05-15', 'Globex Inc', '$850.50', 'Pending'],
    ['INV-003', '2023-05-18', 'Stark Industries', '$3,400.75', 'Paid'],
    ['INV-004', '2023-05-22', 'Wayne Enterprises', '$1,740.20', 'Overdue'],
    ['INV-005', '2023-05-25', 'Umbrella Corp', '$920.30', 'Pending']
  ];

  // Mock export function
  const handleExport = (format: 'csv' | 'excel') => {
    toast({
      title: `Exporting as ${format.toUpperCase()}`,
      description: `Your table is being exported as ${format.toUpperCase()} file.`,
    });
    // In a real app, this would trigger an actual export
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
                <h3 className="text-lg font-medium">Table Preview</h3>
                <Button 
                  onClick={() => setCurrentStep('validate')}
                  className="gap-1"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <ExtractedTablePreview 
                headers={mockHeaders}
                tableData={mockData}
                onExport={handleExport}
              />
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
                    headers={mockHeaders}
                    tableData={mockData}
                    onExport={handleExport}
                  />
                </div>
              ) : (
                <ExtractedTablePreview 
                  headers={mockHeaders}
                  tableData={mockData}
                  onExport={handleExport}
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
                  onClick={() => handleExport('csv')}
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
