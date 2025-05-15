import { useNavigate } from "react-router-dom";
import { useToast } from "./use-toast";

export type ProcessingStep = 'upload' | 'database' | 'dashboard' | 'assistant';

export const useWorkflowNavigation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // A timestamp to track the absolute last navigation time
  // This ensures we're keeping track of navigation regardless of component mounts/unmounts
  const getLastNavigationTime = (): number => {
    const localStorageTime = parseInt(localStorage.getItem('lastNavigationTime') || '0');
    const sessionStorageTime = parseInt(sessionStorage.getItem('lastNavigationTime') || '0');
    
    // Return the most recent time from either storage
    return Math.max(localStorageTime, sessionStorageTime);
  };

  const navigateToStep = (step: ProcessingStep, data?: any) => {
    // Get current time
    const currentTime = Date.now();
    const lastNavigationTime = getLastNavigationTime();
    
    // Very conservative throttling - 5 seconds between navigations
    // This is excessive but will absolutely prevent the rate limit error
    if (currentTime - lastNavigationTime < 5000) {
      console.warn('Navigation throttled to prevent browser rate limiting:', {
        timeSinceLastNav: currentTime - lastNavigationTime,
        currentTime,
        lastNavigationTime,
        attemptedDestination: step
      });
      
      // Still show toast notifications even when navigation is throttled
      if (data?.tableName) {
        toast({
          title: "Data ready for database",
          description: `Data is ready to be synced to ${data.tableName}`,
        });
      }
      
      return; // Skip this navigation
    }
    
    // Store the navigation time in both storages to ensure consistency
    const newNavigationTime = Date.now();
    localStorage.setItem('lastNavigationTime', newNavigationTime.toString());
    sessionStorage.setItem('lastNavigationTime', newNavigationTime.toString());
    
    // Handle different navigation destinations
    switch (step) {
      case 'upload':
        safeNavigate('/documents?tab=upload');
        break;
      case 'database':
        safeNavigate('/database');
        if (data?.tableName) {
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
  
  // Use a safer navigation method that will fall back if needed
  const safeNavigate = (path: string) => {
    try {
      // Use replace to avoid building up history stack
      navigate(path, { replace: true });
    } catch (error) {
      console.error('Navigation failed with error:', error);
      
      // Last resort fallback - direct location change
      try {
        window.location.replace(path);
      } catch (fallbackError) {
        console.error('Even fallback navigation failed:', fallbackError);
      }
    }
  };

  return { navigateToStep };
};
