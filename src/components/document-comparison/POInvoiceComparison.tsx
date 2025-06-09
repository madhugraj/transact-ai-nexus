
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle, FileText, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ComparisonData {
  field: string;
  poValue: string | number;
  invoiceValue: string | number;
  match: boolean;
  variance?: number;
  tolerance?: number;
}

interface POInvoiceComparisonProps {
  className?: string;
}

const POInvoiceComparison: React.FC<POInvoiceComparisonProps> = ({ className }) => {
  const [poData, setPOData] = useState<any[]>([]);
  const [invoiceData, setInvoiceData] = useState<any[]>([]);
  const [comparisonResults, setComparisonResults] = useState<ComparisonData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadPOData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('po_table')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPOData(data || []);
      toast({
        title: "PO Data Loaded",
        description: `Loaded ${data?.length || 0} Purchase Orders`,
      });
    } catch (error) {
      console.error('Error loading PO data:', error);
      toast({
        title: "Error",
        description: "Failed to load PO data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadInvoiceData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('invoice_table')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInvoiceData(data || []);
      toast({
        title: "Invoice Data Loaded",
        description: `Loaded ${data?.length || 0} Invoices`,
      });
    } catch (error) {
      console.error('Error loading invoice data:', error);
      toast({
        title: "Error",
        description: "Failed to load invoice data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const compareDocuments = (po: any, invoice: any): ComparisonData[] => {
    const comparisons: ComparisonData[] = [];
    
    // Compare vendor/supplier
    comparisons.push({
      field: 'Vendor/Supplier',
      poValue: po.vendor_name || po.supplier_name || 'N/A',
      invoiceValue: invoice.vendor_name || invoice.supplier_name || 'N/A',
      match: (po.vendor_name || po.supplier_name || '').toLowerCase() === 
             (invoice.vendor_name || invoice.supplier_name || '').toLowerCase()
    });

    // Compare description
    comparisons.push({
      field: 'Description',
      poValue: po.item_description || po.description || 'N/A',
      invoiceValue: invoice.item_description || invoice.description || 'N/A',
      match: (po.item_description || po.description || '').toLowerCase().includes(
             (invoice.item_description || invoice.description || '').toLowerCase()
           ) || (invoice.item_description || invoice.description || '').toLowerCase().includes(
             (po.item_description || po.description || '').toLowerCase()
           )
    });

    // Compare quantity
    const poQty = parseFloat(po.quantity || 0);
    const invoiceQty = parseFloat(invoice.quantity || 0);
    comparisons.push({
      field: 'Quantity',
      poValue: poQty,
      invoiceValue: invoiceQty,
      match: Math.abs(poQty - invoiceQty) <= 0.01,
      variance: Math.abs(poQty - invoiceQty),
      tolerance: 0.01
    });

    // Compare unit price
    const poPrice = parseFloat(po.unit_price || 0);
    const invoicePrice = parseFloat(invoice.unit_price || 0);
    const priceVariance = Math.abs(poPrice - invoicePrice);
    comparisons.push({
      field: 'Unit Price',
      poValue: poPrice.toFixed(2),
      invoiceValue: invoicePrice.toFixed(2),
      match: priceVariance <= 0.01,
      variance: priceVariance,
      tolerance: 0.01
    });

    // Compare total amount
    const poTotal = parseFloat(po.total_amount || po.line_total || 0);
    const invoiceTotal = parseFloat(invoice.total_amount || invoice.line_total || 0);
    const totalVariance = Math.abs(poTotal - invoiceTotal);
    comparisons.push({
      field: 'Total Amount',
      poValue: poTotal.toFixed(2),
      invoiceValue: invoiceTotal.toFixed(2),
      match: totalVariance <= 0.01,
      variance: totalVariance,
      tolerance: 0.01
    });

    // Compare GST rate
    const poGST = parseFloat(po.gst_rate || 0);
    const invoiceGST = parseFloat(invoice.gst_rate || 0);
    comparisons.push({
      field: 'GST Rate (%)',
      poValue: poGST,
      invoiceValue: invoiceGST,
      match: Math.abs(poGST - invoiceGST) <= 0.01,
      variance: Math.abs(poGST - invoiceGST),
      tolerance: 0.01
    });

    return comparisons;
  };

  const runComparison = () => {
    if (poData.length === 0 || invoiceData.length === 0) {
      toast({
        title: "No Data",
        description: "Please load both PO and Invoice data first",
        variant: "destructive",
      });
      return;
    }

    // For demo, compare first PO with first Invoice
    // In practice, you'd match by PO number, vendor, etc.
    const firstPO = poData[0];
    const firstInvoice = invoiceData[0];
    
    const results = compareDocuments(firstPO, firstInvoice);
    setComparisonResults(results);

    const matchCount = results.filter(r => r.match).length;
    toast({
      title: "Comparison Complete",
      description: `${matchCount}/${results.length} fields match`,
    });
  };

  const getStatusBadge = (match: boolean) => {
    return match ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Match
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-800">
        <AlertCircle className="h-3 w-3 mr-1" />
        Mismatch
      </Badge>
    );
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PO vs Invoice Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Data Loading Section */}
            <div className="flex gap-4">
              <Button onClick={loadPOData} disabled={isLoading} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Load PO Data ({poData.length})
              </Button>
              <Button onClick={loadInvoiceData} disabled={isLoading} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Load Invoice Data ({invoiceData.length})
              </Button>
              <Button 
                onClick={runComparison} 
                disabled={isLoading || poData.length === 0 || invoiceData.length === 0}
              >
                Compare Documents
              </Button>
            </div>

            {/* Results Section */}
            {comparisonResults.length > 0 && (
              <Tabs defaultValue="comparison" className="w-full">
                <TabsList>
                  <TabsTrigger value="comparison">Field Comparison</TabsTrigger>
                  <TabsTrigger value="details">Document Details</TabsTrigger>
                </TabsList>
                
                <TabsContent value="comparison">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field</TableHead>
                        <TableHead>PO Value</TableHead>
                        <TableHead>Invoice Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Variance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparisonResults.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{result.field}</TableCell>
                          <TableCell>{result.poValue}</TableCell>
                          <TableCell>{result.invoiceValue}</TableCell>
                          <TableCell>{getStatusBadge(result.match)}</TableCell>
                          <TableCell>
                            {result.variance !== undefined ? (
                              <span className={result.match ? 'text-green-600' : 'text-red-600'}>
                                {result.variance.toFixed(2)}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="details">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Purchase Order</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(poData[0], null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Invoice</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(invoiceData[0], null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default POInvoiceComparison;
