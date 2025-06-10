
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Brain, CheckCircle2 } from 'lucide-react';
import { WorkflowStep } from '@/types/workflow';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { intelligentMatchingService } from '@/services/workflow/IntelligentMatchingService';

interface ComparisonConfigProps {
  step: WorkflowStep;
  onConfigUpdate: (configKey: string, value: any) => void;
}

export const ComparisonConfig: React.FC<ComparisonConfigProps> = ({
  step,
  onConfigUpdate
}) => {
  const { toast } = useToast();
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingMatching, setTestingMatching] = useState(false);
  const [unmatchedPOs, setUnmatchedPOs] = useState<any[]>([]);
  const [unmatchedInvoices, setUnmatchedInvoices] = useState<any[]>([]);

  useEffect(() => {
    loadAvailableTables();
    loadUnmatchedData();
  }, []);

  const loadAvailableTables = async () => {
    try {
      // Known tables for PO-Invoice comparison
      const tables = ['po_table', 'invoice_table', 'compare_po_invoice_table'];
      setAvailableTables(tables);
    } catch (error) {
      console.error('❌ Error loading tables:', error);
    }
  };

  const loadUnmatchedData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [pos, invoices] = await Promise.all([
        intelligentMatchingService.getUnmatchedPOs(user.id),
        intelligentMatchingService.getUnmatchedInvoices(user.id)
      ]);

      setUnmatchedPOs(pos);
      setUnmatchedInvoices(invoices);

      console.log(`📊 Loaded ${pos.length} unmatched POs and ${invoices.length} unmatched invoices`);
    } catch (error) {
      console.error('❌ Error loading unmatched data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testIntelligentMatching = async () => {
    if (unmatchedPOs.length === 0 || unmatchedInvoices.length === 0) {
      toast({
        title: "No Data Available",
        description: "Need both PO and Invoice data to test matching",
        variant: "destructive"
      });
      return;
    }

    setTestingMatching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Test with first available PO and Invoice
      const testPO = unmatchedPOs[0];
      const testInvoice = unmatchedInvoices[0];

      const result = await intelligentMatchingService.performIntelligentComparison(
        testPO.po_number,
        testInvoice.id,
        user.id
      );

      toast({
        title: "Test Matching Completed",
        description: `Confidence Score: ${result.confidenceScore}% - Status: ${result.status}`,
      });

      console.log('🧪 Test matching result:', result);

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
          <Brain className="h-4 w-4" />
          Document Comparison Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Comparison Type</Label>
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
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Source Table</Label>
            <Select
              value={step.config.comparisonConfig?.sourceTable || 'po_table'}
              onValueChange={(value) => onConfigUpdate('comparisonConfig', {
                ...step.config.comparisonConfig,
                sourceTable: value
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTables.map(table => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Target Table</Label>
            <Select
              value={step.config.comparisonConfig?.targetTable || 'invoice_table'}
              onValueChange={(value) => onConfigUpdate('comparisonConfig', {
                ...step.config.comparisonConfig,
                targetTable: value
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTables.map(table => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Comparison Fields</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {['vendor_name', 'po_number', 'total_amount', 'invoice_date', 'line_items'].map(field => (
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
        </div>

        <div>
          <Label>Tolerance Level: {step.config.comparisonConfig?.tolerance || 0.8}</Label>
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
            value={step.config.comparisonConfig?.matchingCriteria || 'fuzzy'}
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

        {/* Intelligent Matching Controls */}
        <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-600" />
              <Label className="font-medium">Intelligent Matching</Label>
            </div>
            <Switch
              checked={step.config.comparisonConfig?.useIntelligentMatching || false}
              onCheckedChange={(checked) => onConfigUpdate('comparisonConfig', {
                ...step.config.comparisonConfig,
                useIntelligentMatching: checked
              })}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Available POs:</span>
              <Badge variant="outline">{unmatchedPOs.length}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Available Invoices:</span>
              <Badge variant="outline">{unmatchedInvoices.length}</Badge>
            </div>
            
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadUnmatchedData}
                disabled={loading}
                className="flex-1"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={testIntelligentMatching}
                disabled={testingMatching || unmatchedPOs.length === 0 || unmatchedInvoices.length === 0}
                className="flex-1"
              >
                <CheckCircle2 className={`h-3 w-3 mr-1 ${testingMatching ? 'animate-spin' : ''}`} />
                Test Match
              </Button>
            </div>
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="bg-gray-50 p-3 rounded text-sm">
          <p className="font-medium mb-1">Comparison Configuration:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Type: {step.config.comparisonConfig?.type || 'PO-Invoice Comparison'}</li>
            <li>• Fields: {step.config.comparisonConfig?.fields?.join(', ') || 'vendor_name, po_number, total_amount'}</li>
            <li>• Tolerance: {((step.config.comparisonConfig?.tolerance || 0.8) * 100).toFixed(0)}%</li>
            <li>• Matching: {step.config.comparisonConfig?.matchingCriteria || 'Fuzzy'}</li>
            <li>• AI-Powered: {step.config.comparisonConfig?.useIntelligentMatching ? 'Enabled' : 'Disabled'}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
