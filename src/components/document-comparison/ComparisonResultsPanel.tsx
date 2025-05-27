import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, AlertCircle, CheckCircle, Replace } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ComparisonResult, DetailedComparisonResult } from "./types";

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
  console.log("ComparisonResultsPanel rendered with:", {
    detailedResults,
    comparisonResults,
    matchPercentage,
    activeInvoiceIndex
  });
  
  // Safely extract target documents
  const targetDocuments = detailedResults?.targetDocuments || [];
  const sourceDocument = detailedResults?.sourceDocument;
  const comparisonSummary = detailedResults?.comparisonSummary || {};
  
  console.log("Extracted data:", { targetDocuments, sourceDocument, comparisonSummary });

  // Calculate dynamic match percentage from comparison summary
  const dynamicMatchPercentage = comparisonSummary?.match_score || matchPercentage || 0;
  
  // Get target-specific results
  const targetSpecificResults = comparisonSummary?.target_specific_results || [];
  
  // Calculate consolidated match data across all targets
  const consolidatedMatchData = targetSpecificResults.length > 0 ? (() => {
    const highMatches = targetSpecificResults.filter(result => result.match_score >= 80).length;
    const mediumMatches = targetSpecificResults.filter(result => result.match_score >= 60 && result.match_score < 80).length;
    const lowMatches = targetSpecificResults.filter(result => result.match_score < 60).length;
    
    return [
      { name: "High Match (≥80%)", value: highMatches, color: "#00C49F" },
      { name: "Medium Match (60-79%)", value: mediumMatches, color: "#FFBB28" },
      { name: "Low Match (<60%)", value: lowMatches, color: "#FF8042" }
    ].filter(item => item.value > 0);
  })() : [];

  // Prepare comparison type data for charts with dynamic values
  const comparisonTypeData = [{
    category: comparisonSummary.category || "Document Comparison",
    comparison_type: comparisonSummary.comparison_type || "General Comparison",
    match_score: dynamicMatchPercentage,
    issues_found: comparisonSummary.issues_found || 0,
    target_count: targetDocuments.length
  }];

  // Get detailed comparison results for active target
  const getDetailedResultsForTarget = (targetIndex: number) => {
    if (targetIndex === -1) {
      // Return consolidated header results
      return comparisonResults;
    }
    
    // Get target-specific detailed comparison
    const targetResult = targetSpecificResults[targetIndex];
    if (targetResult?.detailed_comparison) {
      return targetResult.detailed_comparison.map((item: any) => ({
        field: item.field || "Unknown Field",
        poValue: item.source_value || "N/A",
        invoiceValue: item.target_value || "N/A",
        sourceValue: item.source_value || "N/A",
        targetValue: item.target_value || "N/A",
        match: item.match || false
      }));
    }
    
    return comparisonResults;
  };

  // Get line items for the active target
  const getLineItemsForTarget = (targetIndex: number) => {
    if (targetIndex === -1) {
      // Return all line items (consolidated view)
      return detailedResults?.lineItems || [];
    }
    
    // Return line items for specific target
    return detailedResults?.lineItems?.filter(item => 
      item.targetIndex === targetIndex
    ) || [];
  };

  const activeDetailedResults = getDetailedResultsForTarget(activeInvoiceIndex);
  const activeLineItems = getLineItemsForTarget(activeInvoiceIndex);

  // Calculate totals for active view
  const calculateTotals = (lineItems: any[]) => {
    const sourceTotal = lineItems.reduce((sum, item) => sum + (item.poTotal || item.sourceTotal || 0), 0);
    const targetTotal = lineItems.reduce((sum, item) => sum + (item.invoiceTotal || item.targetTotal || 0), 0);
    const totalDifference = Math.abs(sourceTotal - targetTotal);
    const percentageDifference = sourceTotal > 0 ? (totalDifference / sourceTotal) * 100 : 0;
    
    return { sourceTotal, targetTotal, totalDifference, percentageDifference };
  };

  const { sourceTotal, targetTotal, totalDifference, percentageDifference } = calculateTotals(activeLineItems);

  // Handle replace functionality
  const handleReplace = () => {
    console.log("Replace button clicked - reloading page");
    window.location.reload();
  };

  // Get match percentage for active target
  const getActiveMatchPercentage = () => {
    if (activeInvoiceIndex === -1) {
      return dynamicMatchPercentage;
    }
    
    const targetResult = targetSpecificResults[activeInvoiceIndex];
    return targetResult?.match_score || dynamicMatchPercentage;
  };

  const activeMatchScore = getActiveMatchPercentage();

  // Get document type and category from results
  const sourceDocType = sourceDocument?.doc_type || comparisonSummary?.source_doc || "Source Document";
  const category = comparisonSummary?.category || "Document Comparison";
  const comparisonType = comparisonSummary?.comparison_type || "Document Analysis";
  
  return (
    <div className="space-y-6">
      {/* Summary Card with Dynamic Content */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Document Comparison Results</span>
            <div className="flex items-center gap-3">
              <span className={`${activeMatchScore > 80 ? 'text-green-600' : activeMatchScore > 60 ? 'text-blue-600' : 'text-red-600'} text-2xl font-bold`}>
                {Math.round(activeMatchScore)}% Match
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReplace}
                className="flex items-center gap-2"
              >
                <Replace className="h-4 w-4" />
                New Comparison
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            {sourceDocType} vs {targetDocuments.length} target document(s)
          </CardDescription>
          <CardDescription className="text-sm text-muted-foreground">
            Category: {category} | Type: {comparisonType}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Consolidated Overview Charts */}
          {consolidatedMatchData.length > 0 && activeInvoiceIndex === -1 && (
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-md font-semibold mb-2 text-center">Overall Match Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={consolidatedMatchData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {consolidatedMatchData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-semibold mb-2 text-center">Comparison Analysis</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="match_score" name="Match Score %" fill="#8884d8" />
                      <Bar dataKey="issues_found" name="Issues Found" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Target Document Tabs for Detailed View */}
          {targetDocuments.length > 0 && (
            <Tabs value={activeInvoiceIndex.toString()} onValueChange={(value) => setActiveInvoiceIndex(parseInt(value))}>
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(targetDocuments.length + 1, 5)}, 1fr)` }}>
                <TabsTrigger value="-1">All Targets</TabsTrigger>
                {targetDocuments.slice(0, 4).map((doc, index) => (
                  <TabsTrigger key={index} value={index.toString()}>
                    {doc.title?.split('.')[0].substring(0, 10) || `Target ${index + 1}`}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value="-1" className="mt-4">
                <div className="text-center py-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-sm font-medium">Consolidated view of all {targetDocuments.length} target documents</p>
                  <p className="text-xs text-muted-foreground">Overall Match Score: {Math.round(dynamicMatchPercentage)}%</p>
                </div>
              </TabsContent>
              
              {targetDocuments.map((doc, index) => {
                const targetResult = targetSpecificResults[index] || {};
                return (
                  <TabsContent key={index} value={index.toString()} className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-md">
                          {sourceDocType} vs {doc.title || `Target ${index + 1}`}
                        </CardTitle>
                        <CardDescription>
                          Document Type: {doc.type || 'Unknown'} | 
                          Match Score: {Math.round(targetResult.match_score || 0)}% |
                          Issues: {targetResult.issues?.length || 0}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          <p><strong>Target Document:</strong> {doc.title}</p>
                          <p><strong>Issues Found:</strong> {targetResult.issues?.join(', ') || 'None'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}

          {/* Financial summary - only show if we have totals */}
          {(sourceTotal > 0 || targetTotal > 0) && (
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-300">Source Total</div>
                <div className="text-2xl font-bold">${sourceTotal.toFixed(2)}</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md">
                <div className="text-sm font-medium text-amber-600 dark:text-amber-300">Target Total</div>
                <div className="text-2xl font-bold">${targetTotal.toFixed(2)}</div>
              </div>
              <div className={`${percentageDifference > 5 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'} p-4 rounded-md`}>
                <div className={`text-sm font-medium ${percentageDifference > 5 ? 'text-red-600 dark:text-red-300' : 'text-green-600 dark:text-green-300'}`}>
                  Difference
                </div>
                <div className="text-2xl font-bold">${totalDifference.toFixed(2)} ({percentageDifference.toFixed(2)}%)</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Line Item Comparison Table - only show if we have line items */}
      {activeLineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Line Item Comparison {activeInvoiceIndex >= 0 ? `- ${targetDocuments[activeInvoiceIndex]?.title || `Target ${activeInvoiceIndex + 1}`}` : '- All Targets'}
            </CardTitle>
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
                  {activeLineItems.map((item, index) => (
                    <TableRow key={item.id || index} className={!item.totalMatch && !item.match ? "bg-red-50 dark:bg-red-900/10" : ""}>
                      <TableCell className="font-medium">{item.itemName || item.item || `Item ${index + 1}`}</TableCell>
                      <TableCell className={`text-right ${!item.quantityMatch ? "text-red-600 font-medium" : ""}`}>
                        {item.poQuantity || item.sourceQuantity || 0}
                      </TableCell>
                      <TableCell className={`text-right ${!item.quantityMatch ? "text-red-600 font-medium" : ""}`}>
                        {item.invoiceQuantity || item.targetQuantity || 0}
                      </TableCell>
                      <TableCell className={`text-right ${!item.priceMatch ? "text-red-600 font-medium" : ""}`}>
                        ${(item.poUnitPrice || item.sourceUnitPrice || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right ${!item.priceMatch ? "text-red-600 font-medium" : ""}`}>
                        ${(item.invoiceUnitPrice || item.targetUnitPrice || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right ${!item.totalMatch && !item.match ? "text-red-600 font-medium" : ""}`}>
                        ${(item.poTotal || item.sourceTotal || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right ${!item.totalMatch && !item.match ? "text-red-600 font-medium" : ""}`}>
                        ${(item.invoiceTotal || item.targetTotal || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {item.totalMatch || item.match ? (
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
      
      {/* Header Fields Comparison with Dynamic Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Header Fields Comparison {activeInvoiceIndex >= 0 ? `- ${targetDocuments[activeInvoiceIndex]?.title || `Target ${activeInvoiceIndex + 1}`}` : '- All Targets'}
          </CardTitle>
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
                {activeDetailedResults.map((result, index) => (
                  <TableRow key={index} className={result.match ? "" : "bg-red-50 dark:bg-red-900/10"}>
                    <TableCell className="font-medium">{result.field}</TableCell>
                    <TableCell>{result.poValue || result.sourceValue}</TableCell>
                    <TableCell>{result.invoiceValue || result.targetValue}</TableCell>
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
