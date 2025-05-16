
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Table, Sparkles, Eye, ArrowRight, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { getExtractedTables } from '@/services/supabaseService';
import { getProcessedDocuments } from '@/utils/documentStorage';

interface RecentDocument {
  id: string;
  name: string;
  type: 'table' | 'document' | 'invoice' | 'statement';
  processedAt: Date;
  path?: string;
}

const AIWorkflowIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'recent' | 'suggestions'>('recent');
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load real extracted tables when component mounts
  useEffect(() => {
    const loadRecentDocuments = async () => {
      setIsLoading(true);
      try {
        // Get data from Supabase
        const tables = await getExtractedTables();
        
        // Get data from localStorage
        const localDocuments = await getProcessedDocuments();
        
        // Combine and format the data
        const formattedDocuments: RecentDocument[] = [
          ...tables.map(table => ({
            id: table.id,
            name: table.title || 'Extracted Table',
            type: 'table' as const,
            processedAt: new Date(table.created_at),
            path: `/assistant?tableId=${table.id}`
          })),
          ...localDocuments
            .filter(doc => !tables.some(table => table.id === doc.id)) // Avoid duplicates
            .map(doc => ({
              id: doc.id,
              name: doc.name || 'Document',
              type: (doc.type as 'table' | 'document' | 'invoice' | 'statement') || 'document',
              processedAt: new Date(doc.extractedAt || Date.now()),
              path: `/assistant?docId=${doc.id}`
            }))
        ];
        
        // Sort by processed date, most recent first
        formattedDocuments.sort((a, b) => b.processedAt.getTime() - a.processedAt.getTime());
        
        // Take only the 5 most recent documents
        setRecentDocuments(formattedDocuments.slice(0, 5));
      } catch (error) {
        console.error('Error loading recent documents:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecentDocuments();
    
    // Set up event listener for document processed events
    const handleDocumentProcessed = () => {
      loadRecentDocuments();
    };
    
    window.addEventListener('documentProcessed', handleDocumentProcessed);
    
    return () => {
      window.removeEventListener('documentProcessed', handleDocumentProcessed);
    };
  }, []);

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'table':
        return <Table className="h-5 w-5 text-blue-500" />;
      case 'invoice':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case 'statement':
        return <FileText className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleDocumentClick = (doc: RecentDocument) => {
    if (doc.path) {
      navigate(doc.path);
    } else {
      toast({
        title: "Document access",
        description: `Opening ${doc.name}`,
      });
    }
  };

  const handleUploadNewDocument = () => {
    navigate('/upload');
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Document Assistant</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'recent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('recent')}
            >
              Recent
            </Button>
            <Button
              variant={activeTab === 'suggestions' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('suggestions')}
            >
              Suggestions
            </Button>
          </div>
        </div>
        <CardDescription>
          Connect your document AI assistant with your processed files
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {activeTab === 'recent' ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Recently processed documents:</p>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : recentDocuments.length > 0 ? (
              <div className="divide-y">
                {recentDocuments.map((doc) => (
                  <div 
                    key={doc.id}
                    className="py-2 flex items-start justify-between cursor-pointer hover:bg-gray-50 rounded-md -mx-2 px-2"
                    onClick={() => handleDocumentClick(doc)}
                  >
                    <div className="flex items-center">
                      {getDocumentIcon(doc.type)}
                      <div className="ml-3">
                        <p className="text-sm font-medium">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs py-0 px-1">
                            {doc.type}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(doc.processedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No documents have been processed yet</p>
              </div>
            )}
            
            <div className="pt-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleUploadNewDocument}
              >
                <FileText className="h-4 w-4 mr-2" />
                Upload new document
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Try asking your AI assistant:</p>
            
            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3 text-left"
                onClick={() => navigate('/assistant')}
              >
                <Sparkles className="h-4 w-4 mr-2 text-blue-500 shrink-0" />
                <span>
                  Analyze the spending patterns in my last quarter's expenses
                </span>
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3 text-left"
                onClick={() => navigate('/assistant')}
              >
                <Table className="h-4 w-4 mr-2 text-green-500 shrink-0" />
                <span>
                  Compare this month's invoices with previous month
                </span>
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3 text-left"
                onClick={() => navigate('/assistant')}
              >
                <Database className="h-4 w-4 mr-2 text-orange-500 shrink-0" />
                <span>
                  Summarize all transactions with vendor ABC Corp
                </span>
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3 text-left"
                onClick={() => navigate('/assistant')}
              >
                <Eye className="h-4 w-4 mr-2 text-purple-500 shrink-0" />
                <span>
                  Find all invoices with due dates in the next 7 days
                </span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIWorkflowIntegration;
