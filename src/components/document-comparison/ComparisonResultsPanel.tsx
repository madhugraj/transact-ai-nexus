
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
import { ComparisonResult, DetailedComparisonResult } from "./DocumentComparison";

interface ComparisonResultsPanelProps {
  poFile: File | null;
  invoiceFiles: File[];
  activeInvoiceIndex: number;
  setActiveInvoiceIndex: (index: number) => void;
  comparisonResults: ComparisonResult[];
  matchPercentage: number;
  detailedResults: DetailedComparisonResult;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const ComparisonResultsPanel: React.FC<ComparisonResultsPanelProps> = ({
  poFile,
  invoiceFiles,
  activeInvoiceIndex,
  setActiveInvoiceIndex,
  comparisonResults,
  matchPercentage,
  detailedResults
}) => {
  // Use dynamic data from detailedResults instead of mock data
  const lineItems = detailedResults.lineItems || [];
  
  // Prepare data for visualization based on actual results
  const matchStatusData = [
    { 
      name: "Matches", 
      value: lineItems.filter(item => 
        item.quantityMatch && item.priceMatch && item.totalMatch
      ).length 
    },
    { 
      name: "Quantity Mismatch", 
      value: lineItems.filter(item => 
        !item.quantityMatch && item.priceMatch
      ).length 
    },
    { 
      name: "Price Mismatch", 
      value: lineItems.filter(item => 
        item.quantityMatch && !item.priceMatch
      ).length 
    },
    { 
      name: "Multiple Issues", 
      value: lineItems.filter(item => 
        !item.quantityMatch && !item.priceMatch
      ).length 
    }
  ].filter(item => item.value > 0); // Only show categories with data

  const quantityComparisonData = lineItems.length > 0 ? lineItems.map(item => ({
    name: item.itemName ? item.itemName.split(' ').slice(0, 2).join(' ') : 'Item',
    poQuantity: item.poQuantity || 0,
    invoiceQuantity: item.invoiceQuantity || 0,
    match: item.quantityMatch ? "Yes" : "No"
  })) : [];

  // Calculate totals from actual line items
  const poTotal = lineItems.reduce((sum, item) => sum + (item.poTotal || 0), 0);
  const invoiceTotal = lineItems.reduce((sum, item) => sum + (item.invoiceTotal || 0), 0);
  const totalDifference = Math.abs(poTotal - invoiceTotal);
  const percentageDifference = poTotal > 0 ? (totalDifference / poTotal) * 100 : 0;

  // Get comparison summary from actual results
  const comparisonSummary = detailedResults.comparisonSummary || {};
  const sourceDocType = detailedResults.sourceDocument?.doc_type || "Unknown";
  const targetDocTypes = detailedResults.targetDocuments?.map(doc => doc.type).join(', ') || "Unknown";
  
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
            {poFile?.name} vs {invoiceFiles.map(f => f.name).join(', ')}
          </CardDescription>
          <CardDescription className="text-sm text-muted-foreground">
            Comparison Type: {sourceDocType} vs {targetDocTypes}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Only show charts if we have line items data */}
          {lineItems.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {/* First chart - Match status pie chart */}
              {matchStatusData.length > 0 && (
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
              )}
              
              {/* Second chart - Quantity comparison */}
              {quantityComparisonData.length > 0 && (
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
                        <Bar dataKey="poQuantity" name="Source Quantity" fill="#8884d8" />
                        <Bar dataKey="invoiceQuantity" name="Target Quantity" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No line item data available for visualization.</p>
              <p className="text-sm">This comparison focuses on header field matching.</p>
            </div>
          )}
          
          {/* Financial summary - only show if we have totals */}
          {(poTotal > 0 || invoiceTotal > 0) && (
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-300">Source Total</div>
                <div className="text-2xl font-bold">${poTotal.toFixed(2)}</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md">
                <div className="text-sm font-medium text-amber-600 dark:text-amber-300">Target Total</div>
                <div className="text-2xl font-bold">${invoiceTotal.toFixed(2)}</div>
              </div>
              <div className={`${percentageDifference > 5 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'} p-4 rounded-md`}>
                <div className={`text-sm font-medium ${percentageDifference > 5 ? 'text-red-600 dark:text-red-300' : 'text-green-600 dark:text-green-300'}`}>
                  Difference
                </div>
                <div className="text-2xl font-bold">${totalDifference.toFixed(2)} ({percentageDifference.toFixed(2)}%)</div>
              </div>
            </div>
          )}

          {/* Show comparison summary if available */}
          {comparisonSummary.status && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-md">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-600 dark:text-gray-300">Status</div>
                  <div className="font-semibold">{comparisonSummary.status}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-600 dark:text-gray-300">Category</div>
                  <div className="font-semibold">{comparisonSummary.category || 'Unknown'}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-600 dark:text-gray-300">Comparison Type</div>
                  <div className="font-semibold">{comparisonSummary.comparison_type || 'Unknown'}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-600 dark:text-gray-300">Issues Found</div>
                  <div className="font-semibold">{comparisonSummary.issues_found || 0}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Line Item Comparison Table - only show if we have line items */}
      {lineItems.length > 0 && (
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
                    <TableHead className="text-right">Source Qty</TableHead>
                    <TableHead className="text-right">Target Qty</TableHead>
                    <TableHead className="text-right">Source Unit Price</TableHead>
                    <TableHead className="text-right">Target Unit Price</TableHead>
                    <TableHead className="text-right">Source Total</TableHead>
                    <TableHead className="text-right">Target Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, index) => (
                    <TableRow key={item.id || index} className={!item.totalMatch ? "bg-red-50 dark:bg-red-900/10" : ""}>
                      <TableCell className="font-medium">{item.itemName || `Item ${index + 1}`}</TableCell>
                      <TableCell className={`text-right ${!item.quantityMatch ? "text-red-600 font-medium" : ""}`}>
                        {item.poQuantity || 0}
                      </TableCell>
                      <TableCell className={`text-right ${!item.quantityMatch ? "text-red-600 font-medium" : ""}`}>
                        {item.invoiceQuantity || 0}
                      </TableCell>
                      <TableCell className={`text-right ${!item.priceMatch ? "text-red-600 font-medium" : ""}`}>
                        ${(item.poUnitPrice || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right ${!item.priceMatch ? "text-red-600 font-medium" : ""}`}>
                        ${(item.invoiceUnitPrice || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right ${!item.totalMatch ? "text-red-600 font-medium" : ""}`}>
                        ${(item.poTotal || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right ${!item.totalMatch ? "text-red-600 font-medium" : ""}`}>
                        ${(item.invoiceTotal || 0).toFixed(2)}
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
      )}
      
      {/* Header Fields Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Header Fields Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Source Value</TableHead>
                  <TableHead>Target Value</TableHead>
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
