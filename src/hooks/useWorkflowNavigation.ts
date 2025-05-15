
import { useNavigate } from "react-router-dom";
import { useToast } from "./use-toast";

export type ProcessingStep = 'upload' | 'database' | 'dashboard' | 'assistant';

export const useWorkflowNavigation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Create a closure variable to track the last navigation time
  // This ensures we're not relying solely on sessionStorage which could be
  // inconsistent during rapid operations
  let lastNavigationTimeMemory = 0;

  const navigateToStep = (step: ProcessingStep, data?: any) => {
    // Get the current time
    const currentTime = Date.now();
    
    // Check from memory first, then fallback to sessionStorage
    const lastNavigationTime = lastNavigationTimeMemory || 
                              parseInt(sessionStorage.getItem('lastNavigationTime') || '0');
    
    // More restrictive throttling - 2 seconds between navigations
    if (currentTime - lastNavigationTime < 2000) {
      console.warn('Navigation throttled to prevent history.replaceState() limit');
      
      // Still show toast notifications even when navigation is throttled
      if (data?.tableName) {
        toast({
          title: "Data ready for database",
          description: `Data is ready to be synced to ${data.tableName}`,
        });
      }
      
      return; // Skip this navigation to prevent rate limiting
    }
    
    // Update both the memory variable and sessionStorage
    lastNavigationTimeMemory = currentTime;
    sessionStorage.setItem('lastNavigationTime', currentTime.toString());
    
    // Use replace instead of push for navigation within workflow to avoid 
    // building up history stack
    switch (step) {
      case 'upload':
        navigate('/documents?tab=upload', { replace: true });
        break;
      case 'database':
        navigate('/database', { replace: true });
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
        navigate('/dashboard', { replace: true });
        toast({
          title: "Analysis complete",
          description: "Your processed data is now available in the dashboard",
        });
        break;
      case 'assistant':
        navigate('/assistant', { replace: true });
        toast({
          title: "Ready for AI assistance",
          description: "Ask questions about your processed data",
        });
        break;
    }
  };

  return { navigateToStep };
};
