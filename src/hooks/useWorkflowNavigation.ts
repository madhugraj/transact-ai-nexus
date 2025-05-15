
import { useNavigate } from "react-router-dom";
import { useToast } from "./use-toast";

export type ProcessingStep = 'upload' | 'database' | 'dashboard' | 'assistant';

export const useWorkflowNavigation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const navigateToStep = (step: ProcessingStep, data?: any) => {
    // Add a check to prevent rapid navigation
    const lastNavigationTime = parseInt(sessionStorage.getItem('lastNavigationTime') || '0');
    const currentTime = Date.now();
    
    if (currentTime - lastNavigationTime < 1000) {
      console.warn('Navigation throttled to prevent history.replaceState() limit');
      return; // Skip this navigation to prevent rate limiting
    }
    
    // Update the last navigation time
    sessionStorage.setItem('lastNavigationTime', currentTime.toString());
    
    switch (step) {
      case 'upload':
        navigate('/documents?tab=upload');
        break;
      case 'database':
        navigate('/database');
        if (data?.tableName) {
          // In a real app, we would store the table information in a global state or context
          localStorage.setItem('lastProcessedTable', data.tableName);
          toast({
            title: "Data ready for database",
            description: `Data is ready to be synced to ${data.tableName}`,
          });
        }
        break;
      case 'dashboard':
        navigate('/dashboard');
        toast({
          title: "Analysis complete",
          description: "Your processed data is now available in the dashboard",
        });
        break;
      case 'assistant':
        navigate('/assistant');
        toast({
          title: "Ready for AI assistance",
          description: "Ask questions about your processed data",
        });
        break;
    }
  };

  return { navigateToStep };
};
