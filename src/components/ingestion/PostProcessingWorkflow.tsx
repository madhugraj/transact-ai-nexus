
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Database, Layers, BarChart, MessageCircle } from 'lucide-react';
import { useWorkflowNavigation, ProcessingStep } from '@/hooks/useWorkflowNavigation';
import { PostProcessAction } from '@/types/processing';

interface PostProcessingWorkflowProps {
  tableName?: string;
  processingType: PostProcessAction;
  onClose?: () => void;
}

const PostProcessingWorkflow = ({ tableName, processingType, onClose }: PostProcessingWorkflowProps) => {
  const { navigateToStep } = useWorkflowNavigation();

  const handleNavigation = (step: ProcessingStep) => {
    if (onClose) onClose();
    navigateToStep(step, { tableName });
  };

  return (
    <Card className="shadow-lg border-green-100">
      <CardHeader className="pb-3 bg-green-50/50">
        <CardTitle className="text-lg text-green-800 flex items-center">
          <Layers className="mr-2 h-5 w-5 text-green-600" />
          Processing Complete
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col space-y-4">
          <p className="text-sm">
            Your files have been processed successfully. What would you like to do next?
          </p>
          
          <div className="flex items-center justify-between text-sm bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <Layers size={16} />
              </div>
              <span className="ml-2 font-medium">Processing Complete</span>
            </div>
            <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                ?
              </div>
              <span className="ml-2 font-medium">Next Step</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            {processingType === 'push_to_db' && (
              <Button
                variant="outline"
                className="justify-start bg-blue-50/50 hover:bg-blue-100/50 transition-all duration-200 hover:scale-105"
                onClick={() => handleNavigation('database')}
              >
                <Database className="mr-2 h-5 w-5 text-blue-600" />
                View in Database
              </Button>
            )}
            
            <Button
              variant="outline"
              className="justify-start bg-purple-50/50 hover:bg-purple-100/50 transition-all duration-200 hover:scale-105"
              onClick={() => handleNavigation('dashboard')}
            >
              <BarChart className="mr-2 h-5 w-5 text-purple-600" />
              View Analysis
            </Button>
            
            <Button
              variant="outline"
              className="justify-start bg-amber-50/50 hover:bg-amber-100/50 transition-all duration-200 hover:scale-105"
              onClick={() => handleNavigation('assistant')}
            >
              <MessageCircle className="mr-2 h-5 w-5 text-amber-600" />
              Ask AI Assistant
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostProcessingWorkflow;
