
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Building, Calendar, DollarSign, Database } from 'lucide-react';
import { POData } from '@/services/api/poProcessingService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PODataDisplayProps {
  poData: POData;
  fileName: string;
  supabaseData?: any;
}

const PODataDisplay: React.FC<PODataDisplayProps> = ({ poData, fileName, supabaseData }) => {
  const { toast } = useToast();

  const handleSaveToSupabase = async () => {
    if (!supabaseData) {
      toast({
        title: "No data to save",
        description: "Supabase formatted data is not available",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Saving to Supabase po_table:', supabaseData);
      
      const { data, error } = await supabase
        .from('po_table')
        .insert([supabaseData])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: `PO data saved to database successfully`,
      });

      console.log('Successfully saved to po_table:', data);
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-green-600" />
          <h4 className="font-medium text-green-800">Extracted PO Data</h4>
          <Badge variant="outline" className="text-xs">
            {fileName}
          </Badge>
        </div>
        
        {supabaseData && (
          <Button 
            onClick={handleSaveToSupabase}
            size="sm"
            className="gap-2"
          >
            <Database className="h-4 w-4" />
            Save to Database
          </Button>
        )}
      </div>

      {/* Header Information */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">PO Number</p>
                <p className="font-mono text-sm font-medium">{poData.po_number || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Vendor</p>
                <p className="text-sm font-medium truncate" title={poData.vendor}>
                  {poData.vendor || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-mono text-sm font-medium">{poData.date || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Items Count</p>
                <p className="font-mono text-sm font-medium">{poData.items?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      {poData.items && poData.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Description</th>
                    <th className="text-right p-2">Qty</th>
                    <th className="text-right p-2">Unit Price</th>
                    <th className="text-right p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {poData.items.map((item, index) => (
                    <tr key={index} className="border-b border-muted">
                      <td className="p-2">{item.description}</td>
                      <td className="p-2 text-right font-mono">{item.quantity}</td>
                      <td className="p-2 text-right font-mono">{item.unit_price}</td>
                      <td className="p-2 text-right font-mono font-medium">{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {poData.shipping_address && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs whitespace-pre-wrap">{poData.shipping_address}</p>
            </CardContent>
          </Card>
        )}

        {poData.billing_address && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Billing Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs whitespace-pre-wrap">{poData.billing_address}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Supabase Data Preview */}
      {supabaseData && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm text-blue-800">Database Format (Ready for po_table)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
              {JSON.stringify(supabaseData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PODataDisplay;
