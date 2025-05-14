
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
    <Card className="shadow-lg border-green-100 overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-green-100/50">
        <CardTitle className="text-lg text-green-800 flex items-center">
          <Layers className="mr-2 h-5 w-5 text-green-600" />
          Processing Complete
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-5">
          <p className="text-sm">
            Your files have been processed successfully. What would you like to do next?
          </p>
          
          <div className="flex items-center justify-between text-sm bg-muted/30 p-4 rounded-lg border border-muted">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-100 to-green-200 text-green-600 flex items-center justify-center">
                <Layers size={18} />
              </div>
              <span className="ml-3 font-medium">Processing Complete</span>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="flex items-center">
                <div className="h-0.5 w-12 bg-gradient-to-r from-green-200 to-blue-200"></div>
                <ArrowRight className="h-4 w-4 mx-1 text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-600 flex items-center justify-center">
                <span className="text-lg font-medium">?</span>
              </div>
              <span className="ml-3 font-medium">Next Step</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            {processingType === 'push_to_db' && (
              <Button
                variant="outline"
                className="justify-start bg-blue-50/50 hover:bg-blue-100/50 transition-all duration-200 hover:scale-105 border border-blue-200/50 h-auto py-3"
                onClick={() => handleNavigation('database')}
              >
                <div className="flex flex-col items-center mr-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Database className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium">View in Database</span>
                  <span className="text-xs text-muted-foreground">Explore your processed data</span>
                </div>
              </Button>
            )}
            
            <Button
              variant="outline"
              className="justify-start bg-purple-50/50 hover:bg-purple-100/50 transition-all duration-200 hover:scale-105 border border-purple-200/50 h-auto py-3"
              onClick={() => handleNavigation('dashboard')}
            >
              <div className="flex flex-col items-center mr-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <BarChart className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="flex flex-col items-start">
                <span className="font-medium">View Analysis</span>
                <span className="text-xs text-muted-foreground">See analytics and insights</span>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="justify-start bg-amber-50/50 hover:bg-amber-100/50 transition-all duration-200 hover:scale-105 border border-amber-200/50 h-auto py-3"
              onClick={() => handleNavigation('assistant')}
            >
              <div className="flex flex-col items-center mr-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <div className="flex flex-col items-start">
                <span className="font-medium">Ask AI Assistant</span>
                <span className="text-xs text-muted-foreground">Get insights from your data</span>
              </div>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostProcessingWorkflow;
