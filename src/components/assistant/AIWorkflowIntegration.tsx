
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, BarChart, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AIWorkflowIntegrationProps {
  showRecentProcessing?: boolean;
}

const AIWorkflowIntegration = ({ showRecentProcessing = true }: AIWorkflowIntegrationProps) => {
  const navigate = useNavigate();
  const lastProcessedTable = localStorage.getItem('lastProcessedTable');

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Document Processing Workflow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 text-sm">
            <div className="bg-primary/10 text-primary rounded-full p-2">
              <MessageCircle size={20} />
            </div>
            <div className="flex-1">
              <p className="font-medium">AI Assistant</p>
              <p className="text-muted-foreground">You are here</p>
            </div>
          </div>
          
          {showRecentProcessing && lastProcessedTable && (
            <div className="bg-muted p-3 rounded-md text-sm">
              <p className="mb-2">Recent processing: <strong>{lastProcessedTable}</strong></p>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/database')}
                  className="h-8"
                >
                  <Database className="mr-1 h-4 w-4" /> View in Database
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/dashboard')}
                  className="h-8"
                >
                  <BarChart className="mr-1 h-4 w-4" /> View Analysis
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="secondary" 
              className="flex-1 justify-start"
              onClick={() => navigate('/documents?tab=upload')}
            >
              <Database className="mr-2 h-4 w-4" /> Upload New Documents
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 justify-start"
              onClick={() => navigate('/dashboard')}
            >
              <BarChart className="mr-2 h-4 w-4" /> View Dashboard
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIWorkflowIntegration;
