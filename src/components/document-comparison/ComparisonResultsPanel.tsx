
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, X, Download, FileText } from 'lucide-react';
import { ComparisonResult, DetailedComparisonResult } from './types';
import { LineItemsTable } from './results/LineItemsTable';
import { FieldComparisonTable } from './results/FieldComparisonTable';
import { exportToCSV } from './utils/csvExporter';

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

  useEffect(() => {
    console.log("🔄 ComparisonResultsPanel: Results changed, resetting active tab");
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

  const targetSpecificResults = detailedResults.comparisonSummary?.target_specific_results || [];
  const targetDocuments = detailedResults.targetDocuments || [];

  console.log("📊 Target-specific data:", {
    targetSpecificResultsCount: targetSpecificResults.length,
    targetDocumentsCount: targetDocuments.length,
    activeTargetIndex
  });

  const activeTargetResult = targetSpecificResults[activeTargetIndex];
  const activeTargetDoc = targetDocuments[activeTargetIndex];

  // Calculate overall match percentage from target-specific results
  const calculatedOverallMatch = targetSpecificResults.length > 0 
    ? Math.round(targetSpecificResults.reduce((sum, target) => sum + (target.score || 0), 0) / targetSpecificResults.length)
    : matchPercentage;

  const finalMatchPercentage = calculatedOverallMatch > 0 ? calculatedOverallMatch : matchPercentage;

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMatchBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">High Match</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Medium Match</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low Match</Badge>;
  };

  const formatIssuesAndRecommendations = (items: string[] | undefined, type: 'issues' | 'recommendations') => {
    if (!items || items.length === 0) {
      if (type === 'issues') {
        return ['All fields match within acceptable thresholds - no critical issues identified'];
      } else {
        return ['Document comparison meets compliance standards - maintain current quality levels'];
      }
    }
    return items;
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

  const downloadCSV = () => {
    if (detailedResults) {
      exportToCSV(detailedResults);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Comparison Results</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadCSV}>
            <FileText className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={downloadResults}>
            <Download className="h-4 w-4 mr-2" />
            JSON
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
            <div className={`text-2xl font-bold ${getMatchColor(finalMatchPercentage)}`}>
              {finalMatchPercentage}%
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
          <Progress value={finalMatchPercentage} className="w-full" />
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
                            {getMatchBadge(targetResult?.score || 0)}
                          </div>
                        </div>
                      </div>

                      {/* Field Comparisons */}
                      {fields.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold mb-2">Field Comparisons</h4>
                          <FieldComparisonTable fields={fields} />
                        </div>
                      )}

                      {/* Line Items Analysis */}
                      {lineItems.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold mb-2">Line Items Analysis</h4>
                          <LineItemsTable lineItems={lineItems} />
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
                                  <div>
                                    <p className="text-sm font-medium text-red-600">Critical Issues:</p>
                                    <ul className="text-xs list-disc list-inside">
                                      {formatIssuesAndRecommendations(targetResult.detailed_analysis.critical_issues, 'issues').map((issue: string, i: number) => (
                                        <li key={i} className={issue.includes('All fields match') ? 'text-green-600' : 'text-red-600'}>{issue}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-blue-600">Recommendations:</p>
                                    <ul className="text-xs list-disc list-inside">
                                      {formatIssuesAndRecommendations(targetResult.detailed_analysis.recommendations, 'recommendations').map((rec: string, i: number) => (
                                        <li key={i} className={rec.includes('meets compliance standards') ? 'text-green-600' : 'text-blue-600'}>{rec}</li>
                                      ))}
                                    </ul>
                                  </div>
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
