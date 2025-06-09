
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, Settings, Database } from 'lucide-react';
import { WorkflowConfig } from '@/types/workflow';
import { useToast } from '@/hooks/use-toast';

interface WorkflowProcessActionsProps {
  workflow: WorkflowConfig;
  onExecute: (workflow: WorkflowConfig) => void;
  nodeCount: number;
}

export const WorkflowProcessActions: React.FC<WorkflowProcessActionsProps> = ({
  workflow,
  onExecute,
  nodeCount
}) => {
  const [selectedProcess, setSelectedProcess] = useState<string>('');
  const { toast } = useToast();

  const processOptions = [
    { value: 'po_invoice_comparison', label: 'PO vs Invoice Comparison', description: 'Compare Purchase Orders with Invoices' },
    { value: 'item_master_mapping', label: 'Item Master Mapping', description: 'Map items to master data' },
    { value: 'vendor_validation', label: 'Vendor Validation', description: 'Validate vendor information' },
    { value: 'document_classification', label: 'Document Classification', description: 'Classify document types' }
  ];

  const handleProcessSelection = (processType: string) => {
    setSelectedProcess(processType);
    
    if (processType === 'po_invoice_comparison') {
      toast({
        title: "PO vs Invoice Comparison Selected",
        description: "This will compare POs and Invoices based on vendor, date, and item descriptions from Supabase tables",
      });
    }
  };

  const handleExecuteWithProcess = () => {
    if (!selectedProcess) {
      toast({
        title: "No Process Selected",
        description: "Please select a processing type before executing",
        variant: "destructive"
      });
      return;
    }

    if (nodeCount === 0) {
      toast({
        title: "No Components",
        description: "Please add workflow components before executing",
        variant: "destructive"
      });
      return;
    }

    // Add processing configuration to workflow
    const enhancedWorkflow: WorkflowConfig = {
      ...workflow,
      processingType: selectedProcess,
      steps: workflow.steps.map(step => {
        if (step.type === 'data-comparison') {
          return {
            ...step,
            config: {
              ...step.config,
              comparisonConfig: {
                type: 'po-invoice-comparison' as const,
                fields: selectedProcess === 'po_invoice_comparison' 
                  ? ['vendor_name', 'po_date', 'invoice_date', 'description', 'quantity', 'total_amount', 'gstn']
                  : [],
                matchingCriteria: 'fuzzy' as const,
                tolerance: 0.8
              }
            }
          };
        }
        return step;
      })
    };

    console.log('🚀 Executing workflow with processing type:', selectedProcess);
    onExecute(enhancedWorkflow);
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Process Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium">Processing Type</label>
          <Select value={selectedProcess} onValueChange={handleProcessSelection}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select process type" />
            </SelectTrigger>
            <SelectContent>
              {processOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProcess === 'po_invoice_comparison' && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <div className="text-xs font-medium text-blue-800 mb-2">PO vs Invoice Matching Logic</div>
            <div className="space-y-1 text-xs text-blue-700">
              <div>• Matches by vendor name (fuzzy matching)</div>
              <div>• Compares dates within tolerance range</div>
              <div>• Matches item descriptions</div>
              <div>• Validates quantities and amounts</div>
              <div>• Checks GST information</div>
            </div>
            <div className="flex gap-1 mt-2">
              <Badge variant="outline" className="text-xs">Source: po_table</Badge>
              <Badge variant="outline" className="text-xs">Target: invoice_table</Badge>
            </div>
          </div>
        )}

        <Button 
          onClick={handleExecuteWithProcess}
          disabled={!selectedProcess || nodeCount === 0}
          className="w-full h-8 text-xs gap-2"
        >
          <PlayCircle className="h-3 w-3" />
          Process Workflow ({nodeCount} components)
        </Button>

        {selectedProcess && (
          <div className="text-xs text-muted-foreground">
            <Database className="h-3 w-3 inline mr-1" />
            Results will be saved to: po_invoice_compare table
          </div>
        )}
      </CardContent>
    </Card>
  );
};
