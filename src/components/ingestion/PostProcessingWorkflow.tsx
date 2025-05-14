
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Database, Layers, BarChart, MessageCircle } from 'lucide-react';
import { useWorkflowNavigation, ProcessingStep } from '@/hooks/useWorkflowNavigation';

interface PostProcessingWorkflowProps {
  tableName?: string;
  processingType: 'table_extraction' | 'insights' | 'combine_data' | 'push_to_db' | 'summary';
  onClose?: () => void;
}

const PostProcessingWorkflow = ({ tableName, processingType, onClose }: PostProcessingWorkflowProps) => {
  const { navigateToStep } = useWorkflowNavigation();

  const handleNavigation = (step: ProcessingStep) => {
    if (onClose) onClose();
    navigateToStep(step, { tableName });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Next Steps</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <p className="text-sm text-muted-foreground">
            Your files have been processed successfully. What would you like to do next?
          </p>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                <Layers size={16} />
              </div>
              <span className="ml-2">Processing Complete</span>
            </div>
            <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center">
                ?
              </div>
              <span className="ml-2">Next Step</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {processingType === 'push_to_db' && (
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => handleNavigation('database')}
              >
                <Database className="mr-2 h-4 w-4" />
                View in Database
              </Button>
            )}
            
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleNavigation('dashboard')}
            >
              <BarChart className="mr-2 h-4 w-4" />
              View Analysis in Dashboard
            </Button>
            
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleNavigation('assistant')}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Ask AI Assistant
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostProcessingWorkflow;
