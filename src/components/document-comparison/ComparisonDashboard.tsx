
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
import { AlertCircle, CheckCircle, Eye, FileText } from 'lucide-react';
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
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ComparisonDashboard: React.FC = () => {
  const [comparisons, setComparisons] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchComparisons();
  }, []);

  const fetchComparisons = async () => {
    try {
      // Fetch source documents
      const { data: sourceDocs, error: sourceError } = await supabase
        .from('compare_source_document')
        .select('*')
        .order('created_at', { ascending: false });

      if (sourceError) throw sourceError;

      // Fetch target documents
      const { data: targetDocs, error: targetError } = await supabase
        .from('compare_target_docs')
        .select('*');

      if (targetError) throw targetError;

      // Combine and format data
      const combinedData: ComparisonData[] = sourceDocs?.map((source) => {
        const targets = targetDocs?.find(t => t.id === source.id);
        const targetTitles = [];
        
        if (targets) {
          for (let i = 1; i <= 5; i++) {
            if (targets[`doc_title_${i}`]) {
              targetTitles.push(targets[`doc_title_${i}`]);
            }
          }
        }

        // Determine category and comparison type based on document types
        const category = getCategoryFromType(source.doc_type);
        const comparison_type = getComparisonType(source.doc_type, targets);
        
        return {
          id: source.id,
          source_doc: source.doc_title || 'Unknown',
          source_type: source.doc_type || 'Unknown',
          target_docs: targetTitles,
          category,
          comparison_type,
          status: targetTitles.length > 0 ? 'Completed' : 'Pending',
          match_score: Math.floor(Math.random() * 40) + 60, // Mock score for now
          issues_found: Math.floor(Math.random() * 5),
          created_at: source.created_at
        };
      }) || [];

      setComparisons(combinedData);
    } catch (error) {
      console.error('Error fetching comparisons:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch comparison data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryFromType = (docType: string): string => {
    if (!docType) return 'Unknown';
    
    if (docType.includes('Procurement') || docType.includes('Finance')) {
      return 'Procurement & Finance';
    } else if (docType.includes('Insurance') || docType.includes('Claims')) {
      return 'Insurance & Claims';
    } else if (docType.includes('HR') || docType.includes('Onboarding')) {
      return 'HR & Onboarding';
    } else if (docType.includes('Healthcare')) {
      return 'Healthcare';
    } else if (docType.includes('Legal')) {
      return 'Legal & Compliance';
    }
    
    return 'Other';
  };

  const getComparisonType = (sourceType: string, targets: any): string => {
    if (!sourceType || !targets) return 'Unknown';
    
    if (sourceType.includes('Purchase Order') || sourceType.includes('PO')) {
      return 'PO vs Invoices';
    } else if (sourceType.includes('Invoice')) {
      return 'Invoice vs Delivery Notes';
    } else if (sourceType.includes('Claim Form')) {
      return 'Claim vs Medical Bills';
    } else if (sourceType.includes('Offer Letter')) {
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
      existing.avgScore = (existing.avgScore + comp.match_score) / 2;
    } else {
      acc.push({
        category: comp.category,
        count: 1,
        avgScore: comp.match_score
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
              {comparisons.filter(c => c.status === 'Completed').length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {Math.round(comparisons.reduce((acc, c) => acc + c.match_score, 0) / comparisons.length) || 0}%
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
                    {comparison.status === 'Completed' && (
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
