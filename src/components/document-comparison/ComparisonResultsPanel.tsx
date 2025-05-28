
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import { ComparisonResult, DetailedComparisonResult } from './types';

interface ComparisonResultsPanelProps {
  results: ComparisonResult[];
  detailedResults: DetailedComparisonResult | null;
  matchPercentage: number;
  onClose: () => void;
}

const ComparisonResultsPanel: React.FC<ComparisonResultsPanelProps> = ({
  results,
  detailedResults,
  matchPercentage,
  onClose
}) => {
  const [activeTargetIndex, setActiveTargetIndex] = useState(0);

  console.log("📊 ComparisonResultsPanel: Rendering with data:", {
    results: results.length,
    detailedResults: !!detailedResults,
    matchPercentage,
    targetDocuments: detailedResults?.targetDocuments?.length || 0
  });

  // Reset active tab when results change
  useEffect(() => {
    setActiveTargetIndex(0);
  }, [detailedResults]);

  if (!detailedResults) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p>No detailed comparison results available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get target-specific results from comparison summary
  const targetSpecificResults = detailedResults.comparisonSummary?.target_specific_results || [];
  const targetDocuments = detailedResults.targetDocuments || [];

  console.log("📊 ComparisonResultsPanel: Target-specific data:", {
    targetSpecificResultsCount: targetSpecificResults.length,
    targetDocumentsCount: targetDocuments.length,
    activeTargetIndex
  });

  // Get results for the currently active target
  const activeTargetResult = targetSpecificResults[activeTargetIndex];
  const activeTargetDoc = targetDocuments[activeTargetIndex];

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMatchBadge = (match: boolean, score?: number) => {
    if (score !== undefined) {
      if (score >= 80) return <Badge className="bg-green-100 text-green-800">High Match</Badge>;
      if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Medium Match</Badge>;
      return <Badge className="bg-red-100 text-red-800">Low Match</Badge>;
    }
    return match ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Match
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <AlertCircle className="h-3 w-3 mr-1" />
        No Match
      </Badge>
    );
  };

  const downloadResults = () => {
    const dataStr = JSON.stringify(detailedResults, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `comparison-results-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Helper function to render line items in a proper table format
  const renderLineItemsTable = (lineItems: any[]) => {
    if (!lineItems || lineItems.length === 0) {
      return <p className="text-muted-foreground">No line items to display</p>;
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source Item</TableHead>
              <TableHead>Target Item</TableHead>
              <TableHead>Description Match</TableHead>
              <TableHead>Quantity Match</TableHead>
              <TableHead>Price Match</TableHead>
              <TableHead>HSN/SAC</TableHead>
              <TableHead>Issues</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.map((item: any, index: number) => {
              const sourceItem = item.po_item || item.source_item;
              const targetItem = item.invoice_item || item.target_item;
              
              return (
                <TableRow key={index}>
                  <TableCell className="max-w-[200px]">
                    {sourceItem ? (
                      <div className="space-y-1 text-xs">
                        <div><strong>Desc:</strong> {sourceItem.partDescription || sourceItem.description || 'N/A'}</div>
                        <div><strong>Qty:</strong> {sourceItem.quantity || 'N/A'}</div>
                        <div><strong>Rate:</strong> {sourceItem.rate || sourceItem.unit_price || 'N/A'}</div>
                        <div><strong>Amount:</strong> {sourceItem.amount || sourceItem.total || 'N/A'}</div>
                        {sourceItem.hsnSac && <div><strong>HSN:</strong> {sourceItem.hsnSac}</div>}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No source data</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    {targetItem ? (
                      <div className="space-y-1 text-xs">
                        <div><strong>Desc:</strong> {targetItem.description || 'N/A'}</div>
                        <div><strong>Qty:</strong> {targetItem.quantity || 'N/A'}</div>
                        <div><strong>Price:</strong> {targetItem.unit_price || 'N/A'}</div>
                        <div><strong>Total:</strong> {targetItem.total || 'N/A'}</div>
                        {targetItem.hsn_sac && <div><strong>HSN:</strong> {targetItem.hsn_sac}</div>}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No target data</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={getMatchColor(item.description_match || 0)}>
                      {item.description_match?.toFixed(1) || '0.0'}%
                    </span>
                  </TableCell>
                  <TableCell>
                    {getMatchBadge(item.quantity_match)}
                  </TableCell>
                  <TableCell>
                    {getMatchBadge(item.price_match)}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <div>Source: {sourceItem?.hsnSac || 'N/A'}</div>
                      <div>Target: {targetItem?.hsn_sac || 'N/A'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      {item.issues?.map((issue: string, i: number) => (
                        <div key={i} className="text-red-600">{issue}</div>
                      )) || <span className="text-green-600">None</span>}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Comparison Results</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadResults}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Comparison Summary</span>
            <div className={`text-2xl font-bold ${getMatchColor(matchPercentage)}`}>
              {matchPercentage}%
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Source Document</p>
              <p className="font-medium">{detailedResults.sourceDocument?.doc_title || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Document Type</p>
              <p className="font-medium">{detailedResults.sourceDocument?.doc_type || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Target Documents</p>
              <p className="font-medium">{targetDocuments.length} documents</p>
            </div>
          </div>
          <Progress value={matchPercentage} className="w-full" />
        </CardContent>
      </Card>

      {/* Target Document Tabs */}
      {targetDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Individual Document Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTargetIndex.toString()} onValueChange={(value) => {
              const newIndex = parseInt(value);
              console.log("📊 Switching to target index:", newIndex);
              setActiveTargetIndex(newIndex);
            }}>
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${targetDocuments.length}, 1fr)` }}>
                {targetDocuments.map((doc, index) => {
                  const targetResult = targetSpecificResults[index];
                  const score = targetResult?.score || 0;
                  
                  return (
                    <TabsTrigger key={index} value={index.toString()} className="flex flex-col items-center">
                      <div className="text-xs truncate max-w-[100px]" title={doc.title}>
                        {doc.title}
                      </div>
                      <div className={`text-sm font-bold ${getMatchColor(score)}`}>
                        {Math.round(score)}%
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {targetDocuments.map((doc, index) => {
                const targetResult = targetSpecificResults[index];
                const fields = targetResult?.fields || [];
                const lineItems = targetResult?.line_items || [];
                
                return (
                  <TabsContent key={index} value={index.toString()} className="mt-4">
                    <div className="space-y-4">
                      {/* Target Document Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Document Name</p>
                          <p className="font-medium">{doc.title}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Document Type</p>
                          <p className="font-medium">{doc.type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Match Score</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold ${getMatchColor(targetResult?.score || 0)}`}>
                              {Math.round(targetResult?.score || 0)}%
                            </span>
                            {getMatchBadge(false, targetResult?.score || 0)}
                          </div>
                        </div>
                      </div>

                      {/* Field Comparisons */}
                      {fields.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold mb-2">Field Comparisons</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Field</TableHead>
                                <TableHead>Source Value</TableHead>
                                <TableHead>Target Value</TableHead>
                                <TableHead>Match %</TableHead>
                                <TableHead>Weight</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {fields.map((field: any, fieldIndex: number) => (
                                <TableRow key={fieldIndex}>
                                  <TableCell className="font-medium">{field.field}</TableCell>
                                  <TableCell className="max-w-[150px] truncate" title={field.source_value}>
                                    {field.source_value || "N/A"}
                                  </TableCell>
                                  <TableCell className="max-w-[150px] truncate" title={field.target_value}>
                                    {field.target_value || "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    <span className={getMatchColor(field.match_percentage || 0)}>
                                      {field.match_percentage?.toFixed(1) || 0}%
                                    </span>
                                  </TableCell>
                                  <TableCell>{Math.round((field.weight || 0) * 100)}%</TableCell>
                                  <TableCell>
                                    {getMatchBadge(field.match)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {/* Line Items Analysis */}
                      {lineItems.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold mb-2">Line Items Analysis</h4>
                          {renderLineItemsTable(lineItems)}
                        </div>
                      )}

                      {/* Detailed Analysis */}
                      {targetResult?.detailed_analysis && (
                        <div>
                          <h4 className="text-lg font-semibold mb-2">Detailed Analysis</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm">Calculation Breakdown</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <pre className="text-xs whitespace-pre-wrap">
                                  {targetResult.detailed_analysis.calculation_breakdown || "No calculation details available"}
                                </pre>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm">Issues & Recommendations</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  {targetResult.detailed_analysis.critical_issues?.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium text-red-600">Critical Issues:</p>
                                      <ul className="text-xs list-disc list-inside">
                                        {targetResult.detailed_analysis.critical_issues.map((issue: string, i: number) => (
                                          <li key={i}>{issue}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {targetResult.detailed_analysis.recommendations?.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium text-blue-600">Recommendations:</p>
                                      <ul className="text-xs list-disc list-inside">
                                        {targetResult.detailed_analysis.recommendations.map((rec: string, i: number) => (
                                          <li key={i}>{rec}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ComparisonResultsPanel;
