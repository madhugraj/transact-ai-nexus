
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, AlertCircle, CheckCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { ComparisonResult } from "./DocumentComparison";

// Expanded comparison result type to include line items
export interface LineItemComparison {
  id: string;
  itemName: string;
  poQuantity: number;
  invoiceQuantity: number;
  poUnitPrice: number;
  invoiceUnitPrice: number;
  poTotal: number;
  invoiceTotal: number;
  quantityMatch: boolean;
  priceMatch: boolean;
  totalMatch: boolean;
}

export interface DetailedComparisonResult {
  overallMatch: number;
  headerResults: ComparisonResult[];
  lineItems: LineItemComparison[];
}

interface ComparisonResultsPanelProps {
  poFile: File | null;
  invoiceFiles: File[];
  activeInvoiceIndex: number;
  setActiveInvoiceIndex: (index: number) => void;
  comparisonResults: ComparisonResult[];
  matchPercentage: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const ComparisonResultsPanel: React.FC<ComparisonResultsPanelProps> = ({
  poFile,
  invoiceFiles,
  activeInvoiceIndex,
  setActiveInvoiceIndex,
  comparisonResults,
  matchPercentage
}) => {
  // Mock data for the detailed comparison (in a real app, this would come from props)
  const detailedResults: DetailedComparisonResult = {
    overallMatch: matchPercentage,
    headerResults: comparisonResults,
    lineItems: [
      {
        id: "1",
        itemName: "iPhone 14 Pro",
        poQuantity: 2,
        invoiceQuantity: 2,
        poUnitPrice: 999.00,
        invoiceUnitPrice: 999.00,
        poTotal: 1998.00,
        invoiceTotal: 1998.00,
        quantityMatch: true,
        priceMatch: true,
        totalMatch: true
      },
      {
        id: "2",
        itemName: "iPad Pro 12.9",
        poQuantity: 4,
        invoiceQuantity: 3,
        poUnitPrice: 1099.00,
        invoiceUnitPrice: 1099.00,
        poTotal: 4396.00,
        invoiceTotal: 3297.00,
        quantityMatch: false,
        priceMatch: true,
        totalMatch: false
      },
      {
        id: "3",
        itemName: "Magic Mouse",
        poQuantity: 5,
        invoiceQuantity: 5,
        poUnitPrice: 99.00,
        invoiceUnitPrice: 109.00,
        poTotal: 495.00,
        invoiceTotal: 545.00,
        quantityMatch: true,
        priceMatch: false,
        totalMatch: false
      },
      {
        id: "4",
        itemName: "MacBook Pro 16",
        poQuantity: 1,
        invoiceQuantity: 0,
        poUnitPrice: 2499.00,
        invoiceUnitPrice: 0,
        poTotal: 2499.00,
        invoiceTotal: 0,
        quantityMatch: false,
        priceMatch: false,
        totalMatch: false
      }
    ]
  };

  // Prepare data for visualization
  const matchStatusData = [
    { name: "Matches", value: detailedResults.lineItems.filter(item => 
      item.quantityMatch && item.priceMatch && item.totalMatch).length },
    { name: "Quantity Mismatch", value: detailedResults.lineItems.filter(item => 
      !item.quantityMatch && item.priceMatch).length },
    { name: "Price Mismatch", value: detailedResults.lineItems.filter(item => 
      item.quantityMatch && !item.priceMatch).length },
    { name: "Multiple Issues", value: detailedResults.lineItems.filter(item => 
      !item.quantityMatch && !item.priceMatch).length }
  ];

  const quantityComparisonData = detailedResults.lineItems.map(item => ({
    name: item.itemName.split(' ').slice(0, 2).join(' '),
    poQuantity: item.poQuantity,
    invoiceQuantity: item.invoiceQuantity,
    match: item.quantityMatch ? "Yes" : "No"
  }));

  // Calculate totals
  const poTotal = detailedResults.lineItems.reduce((sum, item) => sum + item.poTotal, 0);
  const invoiceTotal = detailedResults.lineItems.reduce((sum, item) => sum + item.invoiceTotal, 0);
  const totalDifference = Math.abs(poTotal - invoiceTotal);
  const percentageDifference = (totalDifference / poTotal) * 100;
  
  return (
    <div className="space-y-6">
      {/* Invoice selector if multiple invoices */}
      {invoiceFiles.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {invoiceFiles.map((file, index) => (
            <Button
              key={index}
              variant={activeInvoiceIndex === index ? "default" : "outline"}
              className="text-xs"
              onClick={() => setActiveInvoiceIndex(index)}
            >
              {file.name}
            </Button>
          ))}
        </div>
      )}
      
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>
              Document Comparison Summary
            </span>
            <span className={`${matchPercentage > 80 ? 'text-green-600' : 'text-red-600'} text-2xl font-bold`}>
              {matchPercentage}% Match
            </span>
          </CardTitle>
          <CardDescription>
            {poFile?.name} vs {invoiceFiles[activeInvoiceIndex]?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* First chart - Match status pie chart */}
            <div>
              <h3 className="text-md font-semibold mb-2 text-center">Line Items Match Status</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={matchStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {matchStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Second chart - Quantity comparison */}
            <div>
              <h3 className="text-md font-semibold mb-2 text-center">Quantity Comparison</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={quantityComparisonData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="poQuantity" name="PO Quantity" fill="#8884d8" />
                    <Bar dataKey="invoiceQuantity" name="Invoice Quantity" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Financial summary */}
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
              <div className="text-sm font-medium text-blue-600 dark:text-blue-300">PO Total</div>
              <div className="text-2xl font-bold">${poTotal.toFixed(2)}</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md">
              <div className="text-sm font-medium text-amber-600 dark:text-amber-300">Invoice Total</div>
              <div className="text-2xl font-bold">${invoiceTotal.toFixed(2)}</div>
            </div>
            <div className={`${percentageDifference > 5 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'} p-4 rounded-md`}>
              <div className={`text-sm font-medium ${percentageDifference > 5 ? 'text-red-600 dark:text-red-300' : 'text-green-600 dark:text-green-300'}`}>
                Difference
              </div>
              <div className="text-2xl font-bold">${totalDifference.toFixed(2)} ({percentageDifference.toFixed(2)}%)</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Line Item Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Line Item Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">PO Qty</TableHead>
                  <TableHead className="text-right">Invoice Qty</TableHead>
                  <TableHead className="text-right">PO Unit Price</TableHead>
                  <TableHead className="text-right">Invoice Unit Price</TableHead>
                  <TableHead className="text-right">PO Total</TableHead>
                  <TableHead className="text-right">Invoice Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailedResults.lineItems.map((item) => (
                  <TableRow key={item.id} className={!item.totalMatch ? "bg-red-50 dark:bg-red-900/10" : ""}>
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell className={`text-right ${!item.quantityMatch ? "text-red-600 font-medium" : ""}`}>
                      {item.poQuantity}
                    </TableCell>
                    <TableCell className={`text-right ${!item.quantityMatch ? "text-red-600 font-medium" : ""}`}>
                      {item.invoiceQuantity}
                    </TableCell>
                    <TableCell className={`text-right ${!item.priceMatch ? "text-red-600 font-medium" : ""}`}>
                      ${item.poUnitPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className={`text-right ${!item.priceMatch ? "text-red-600 font-medium" : ""}`}>
                      ${item.invoiceUnitPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className={`text-right ${!item.totalMatch ? "text-red-600 font-medium" : ""}`}>
                      ${item.poTotal.toFixed(2)}
                    </TableCell>
                    <TableCell className={`text-right ${!item.totalMatch ? "text-red-600 font-medium" : ""}`}>
                      ${item.invoiceTotal.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {item.totalMatch ? (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-green-600">Match</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-red-600">Mismatch</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Header Fields Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Header Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>PO Value</TableHead>
                  <TableHead>Invoice Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonResults.map((result, index) => (
                  <TableRow key={index} className={result.match ? "" : "bg-red-50 dark:bg-red-900/10"}>
                    <TableCell className="font-medium">{result.field}</TableCell>
                    <TableCell>{result.poValue}</TableCell>
                    <TableCell>{result.invoiceValue}</TableCell>
                    <TableCell>
                      {result.match ? (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-green-600">Match</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-red-600">Mismatch</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline">
          Request Approval
        </Button>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Comparison Report
        </Button>
      </div>
    </div>
  );
};

