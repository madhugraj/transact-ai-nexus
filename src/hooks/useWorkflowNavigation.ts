
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
  
  // Use a more permanent storage for app-wide navigation tracking
  const getLastNavigationTime = () => {
    return Math.max(
      lastNavigationTimeMemory,
      parseInt(sessionStorage.getItem('lastNavigationTime') || '0'),
      parseInt(localStorage.getItem('lastNavigationTime') || '0')
    );
  };

  const navigateToStep = (step: ProcessingStep, data?: any) => {
    // Get the current time
    const currentTime = Date.now();
    
    // Check from multiple sources to ensure we have the most accurate last navigation time
    const lastNavigationTime = getLastNavigationTime();
    
    // Even more restrictive throttling - 3 seconds between navigations
    if (currentTime - lastNavigationTime < 3000) {
      console.warn('Navigation throttled to prevent history.replaceState() limit', {
        timeSinceLastNav: currentTime - lastNavigationTime,
        currentTime,
        lastNavigationTime
      });
      
      // Still show toast notifications even when navigation is throttled
      if (data?.tableName) {
        toast({
          title: "Data ready for database",
          description: `Data is ready to be synced to ${data.tableName}`,
        });
      }
      
      return; // Skip this navigation to prevent rate limiting
    }
    
    // Update all tracking mechanisms
    lastNavigationTimeMemory = currentTime;
    sessionStorage.setItem('lastNavigationTime', currentTime.toString());
    localStorage.setItem('lastNavigationTime', currentTime.toString());
    
    // Create a helper to safely navigate
    const safeNavigate = (path: string) => {
      try {
        navigate(path, { replace: true });
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback to simple location change if navigate fails
        window.location.href = path;
      }
    };
    
    // Use replace instead of push for navigation within workflow to avoid 
    // building up history stack
    switch (step) {
      case 'upload':
        safeNavigate('/documents?tab=upload');
        break;
      case 'database':
        safeNavigate('/database');
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
        safeNavigate('/dashboard');
        toast({
          title: "Analysis complete",
          description: "Your processed data is now available in the dashboard",
        });
        break;
      case 'assistant':
        safeNavigate('/assistant');
        toast({
          title: "Ready for AI assistance",
          description: "Ask questions about your processed data",
        });
        break;
    }
  };

  return { navigateToStep };
};
