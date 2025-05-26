
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { AlertCircle, CheckCircle, Eye, FileText, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ComparisonData {
  id: number;
  source_doc: string;
  source_type: string;
  target_docs: string[];
  category: string;
  comparison_type: string;
  status: string;
  match_score: number;
  issues_found: number;
  created_at: string;
  detailed_results?: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ComparisonDashboard: React.FC = () => {
  const [comparisons, setComparisons] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchComparisons();
    
    // Listen for comparison complete events
    const handleComparisonComplete = () => {
      console.log("Dashboard received comparison complete event, refreshing...");
      fetchComparisons();
    };
    
    window.addEventListener('comparisonComplete', handleComparisonComplete);
    
    return () => {
      window.removeEventListener('comparisonComplete', handleComparisonComplete);
    };
  }, []);

  const fetchComparisons = async () => {
    try {
      setRefreshing(true);
      console.log("Fetching comparison data for dashboard...");
      
      // Fetch comparison results with source document details
      const { data: comparisonResults, error: resultsError } = await supabase
        .from('Doc_Compare_results')
        .select(`
          *,
          compare_source_document!Doc_Compare_results_doc_id_compare_fkey (
            doc_title,
            doc_type,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (resultsError) {
        console.error("Error fetching comparison results:", resultsError);
        throw resultsError;
      }

      console.log("Raw comparison results:", comparisonResults);

      // Transform the data for dashboard display
      const transformedData: ComparisonData[] = comparisonResults?.map((result) => {
        const comparisonData = result.doc_compare_results as any;
        const summary = comparisonData?.comparison_summary || {};
        
        // Extract target document names from comparison results
        const targetDocs = summary.target_docs || [];
        
        return {
          id: result.id,
          source_doc: summary.source_doc || result.compare_source_document?.doc_title || 'Unknown Document',
          source_type: result.doc_type_source || 'Unknown',
          target_docs: Array.isArray(targetDocs) ? targetDocs : [targetDocs].filter(Boolean),
          category: summary.category || getCategoryFromType(result.doc_type_source),
          comparison_type: summary.comparison_type || getComparisonType(result.doc_type_source, result.doc_type_target),
          status: summary.status || 'Completed',
          match_score: summary.match_score || comparisonData?.match_percentage || 0,
          issues_found: summary.issues_found || 0,
          created_at: result.created_at,
          detailed_results: comparisonData
        };
      }) || [];

      console.log("Transformed dashboard data:", transformedData);
      setComparisons(transformedData);
      
    } catch (error) {
      console.error('Error fetching comparisons:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch comparison data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getCategoryFromType = (docType: string): string => {
    if (!docType) return 'Unknown';
    
    const type = docType.toLowerCase();
    if (type.includes('purchase') || type.includes('invoice') || type.includes('payment') || type.includes('delivery')) {
      return 'Procurement & Finance';
    } else if (type.includes('claim') || type.includes('medical') || type.includes('accident') || type.includes('insurance')) {
      return 'Insurance & Claims';
    } else if (type.includes('offer') || type.includes('resume') || type.includes('employment') || type.includes('hr')) {
      return 'HR & Onboarding';
    }
    
    return 'Other';
  };

  const getComparisonType = (sourceType: string, targetType: string): string => {
    if (!sourceType) return 'Unknown';
    
    const source = sourceType.toLowerCase();
    if (source.includes('purchase') || source.includes('po')) {
      return 'PO vs Invoices';
    } else if (source.includes('invoice')) {
      return 'Invoice vs Delivery Notes';
    } else if (source.includes('claim')) {
      return 'Claim vs Medical Bills';
    } else if (source.includes('offer')) {
      return 'Offer vs Documents';
    }
    
    return 'Document Comparison';
  };

  const getStatusColor = (status: string, score: number) => {
    if (status === 'Pending') return 'bg-yellow-100 text-yellow-800';
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (status: string, score: number) => {
    if (status === 'Pending') return <AlertCircle className="h-4 w-4" />;
    if (score >= 80) return <CheckCircle className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  // Prepare chart data
  const categoryData = comparisons.reduce((acc, comp) => {
    const existing = acc.find(item => item.category === comp.category);
    if (existing) {
      existing.count += 1;
      existing.avgScore = Math.round((existing.avgScore * (existing.count - 1) + comp.match_score) / existing.count);
    } else {
      acc.push({
        category: comp.category,
        count: 1,
        avgScore: Math.round(comp.match_score)
      });
    }
    return acc;
  }, [] as Array<{category: string, count: number, avgScore: number}>);

  const statusData = comparisons.reduce((acc, comp) => {
    const status = comp.status === 'Pending' ? 'Pending' : 
                  comp.match_score >= 80 ? 'High Match' :
                  comp.match_score >= 60 ? 'Medium Match' : 'Low Match';
    
    const existing = acc.find(item => item.name === status);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: status, value: 1 });
    }
    return acc;
  }, [] as Array<{name: string, value: number}>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading comparison data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Comparison Dashboard</h2>
        <Button 
          onClick={fetchComparisons} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{comparisons.length}</div>
            <div className="text-sm text-muted-foreground">Total Comparisons</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {comparisons.filter(c => c.status !== 'Pending').length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {comparisons.length > 0 ? Math.round(comparisons.reduce((acc, c) => acc + c.match_score, 0) / comparisons.length) : 0}%
            </div>
            <div className="text-sm text-muted-foreground">Avg Match Score</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {comparisons.reduce((acc, c) => acc + c.issues_found, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Issues</div>
          </CardContent>
        </Card>
      </div>

      {comparisons.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Comparisons by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Match Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Comparisons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comparisons.map((comparison) => (
              <div key={comparison.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="font-medium">{comparison.source_doc}</div>
                    <div className="text-sm text-muted-foreground">
                      {comparison.comparison_type} • {comparison.category}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {comparison.target_docs.length} target document(s)
                      {comparison.target_docs.length > 0 && `: ${comparison.target_docs.slice(0, 2).join(', ')}${comparison.target_docs.length > 2 ? '...' : ''}`}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(comparison.status, comparison.match_score)}>
                        {getStatusIcon(comparison.status, comparison.match_score)}
                        <span className="ml-1">
                          {comparison.status === 'Pending' ? 'Pending' : `${comparison.match_score}% Match`}
                        </span>
                      </Badge>
                    </div>
                    {comparison.status !== 'Pending' && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {comparison.issues_found} issues found
                      </div>
                    )}
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {comparisons.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No comparisons found. Upload documents to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparisonDashboard;
