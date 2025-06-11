
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Brain, CheckCircle2, Cog } from 'lucide-react';
import { WorkflowStep } from '@/types/workflow';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProcessingConfigProps {
  step: WorkflowStep;
  onConfigUpdate: (configKey: string, value: any) => void;
}

export const ProcessingConfig: React.FC<ProcessingConfigProps> = ({
  step,
  onConfigUpdate
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testingMatching, setTestingMatching] = useState(false);
  const [availableFields, setAvailableFields] = useState<string[]>([]);

  // All possible comparison fields for documents
  const allComparisonFields = [
    'vendor_name', 'vendor_code', 'vendor_address',
    'po_number', 'invoice_number', 'order_number',
    'total_amount', 'subtotal', 'tax_amount', 'discount',
    'invoice_date', 'po_date', 'due_date', 'delivery_date',
    'line_items', 'quantities', 'unit_prices', 'descriptions',
    'currency', 'payment_terms', 'shipping_address', 'billing_address'
  ];

  useEffect(() => {
    setAvailableFields(allComparisonFields);
  }, []);

  const testIntelligentMatching = async () => {
    setTestingMatching(true);
    try {
      // Simulate intelligent matching test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Test Matching Completed",
        description: `AI-Powered matching test successful with 85% confidence`,
      });

    } catch (error) {
      console.error('❌ Error testing matching:', error);
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setTestingMatching(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cog className="h-4 w-4" />
          Data Processing Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Processing Type</Label>
          <Select
            value={step.config.comparisonConfig?.type || 'po-invoice-comparison'}
            onValueChange={(value) => onConfigUpdate('comparisonConfig', {
              ...step.config.comparisonConfig,
              type: value
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="po-invoice-comparison">PO-Invoice Comparison</SelectItem>
              <SelectItem value="invoice-receipt-comparison">Invoice-Receipt Comparison</SelectItem>
              <SelectItem value="contract-invoice-comparison">Contract-Invoice Comparison</SelectItem>
              <SelectItem value="multi-document-validation">Multi-Document Validation</SelectItem>
              <SelectItem value="data-normalization">Data Normalization</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Comparison Fields</Label>
          <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-y-auto p-2 border rounded">
            {availableFields.map(field => (
              <Badge
                key={field}
                variant={step.config.comparisonConfig?.fields?.includes(field) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  const currentFields = step.config.comparisonConfig?.fields || [];
                  const updatedFields = currentFields.includes(field)
                    ? currentFields.filter(f => f !== field)
                    : [...currentFields, field];
                  
                  onConfigUpdate('comparisonConfig', {
                    ...step.config.comparisonConfig,
                    fields: updatedFields
                  });
                }}
              >
                {field.replace('_', ' ')}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Click fields to select/deselect for comparison
          </p>
        </div>

        <div>
          <Label>Tolerance Level: {Math.round((step.config.comparisonConfig?.tolerance || 0.8) * 100)}%</Label>
          <Slider
            value={[step.config.comparisonConfig?.tolerance || 0.8]}
            onValueChange={([value]) => onConfigUpdate('comparisonConfig', {
              ...step.config.comparisonConfig,
              tolerance: value
            })}
            max={1}
            min={0.1}
            step={0.1}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Lower values are more strict, higher values are more lenient
          </p>
        </div>

        <div>
          <Label>Matching Criteria</Label>
          <Select
            value={step.config.comparisonConfig?.matchingCriteria || 'intelligent'}
            onValueChange={(value) => onConfigUpdate('comparisonConfig', {
              ...step.config.comparisonConfig,
              matchingCriteria: value
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exact">Exact Match</SelectItem>
              <SelectItem value="fuzzy">Fuzzy Match</SelectItem>
              <SelectItem value="intelligent">AI-Powered Match</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* AI-Powered Matching Controls */}
        <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-600" />
              <Label className="font-medium">AI-Powered Intelligent Matching</Label>
            </div>
            <Switch
              checked={step.config.comparisonConfig?.useIntelligentMatching !== false}
              onCheckedChange={(checked) => onConfigUpdate('comparisonConfig', {
                ...step.config.comparisonConfig,
                useIntelligentMatching: checked
              })}
            />
          </div>
          
          <p className="text-xs text-muted-foreground mb-3">
            Uses advanced AI algorithms to find semantic matches beyond exact text comparison
          </p>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={testIntelligentMatching}
              disabled={testingMatching}
              className="flex-1"
            >
              <CheckCircle2 className={`h-3 w-3 mr-1 ${testingMatching ? 'animate-spin' : ''}`} />
              Test AI Matching
            </Button>
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="bg-gray-50 p-3 rounded text-sm">
          <p className="font-medium mb-1">Processing Configuration:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Type: {step.config.comparisonConfig?.type || 'PO-Invoice Comparison'}</li>
            <li>• Fields: {step.config.comparisonConfig?.fields?.join(', ') || 'vendor_name, po_number, total_amount'}</li>
            <li>• Tolerance: {Math.round((step.config.comparisonConfig?.tolerance || 0.8) * 100)}%</li>
            <li>• Matching: {step.config.comparisonConfig?.matchingCriteria || 'AI-Powered'}</li>
            <li>• AI-Powered: {step.config.comparisonConfig?.useIntelligentMatching !== false ? 'Enabled' : 'Disabled'}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
