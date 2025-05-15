
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Skip if we've already tried to redirect in this component instance
    if (hasRedirected) {
      return;
    }

    // Use both localStorage and an in-component state to prevent loops
    const redirectKey = 'indexRedirectedAt';
    const lastRedirectTime = parseInt(localStorage.getItem(redirectKey) || '0');
    const currentTime = Date.now();
    
    // Don't redirect more than once per 2 seconds
    if (currentTime - lastRedirectTime < 2000) {
      console.log('Redirect throttled to prevent browser rate limiting');
      return;
    }

    // Mark that we've attempted redirect in this component instance
    setHasRedirected(true);
    
    // Set redirect time in localStorage
    localStorage.setItem(redirectKey, currentTime.toString());
    
    // Use setTimeout to ensure state changes have propagated
    const timer = setTimeout(() => {
      try {
        navigate("/assistant", { replace: true });
      } catch (error) {
        console.error('Navigation failed:', error);
        // Fallback: direct location change if navigate fails
        window.location.href = '/assistant';
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [navigate, hasRedirected]);

  return (
    <div className="p-8 flex flex-col items-center justify-center h-screen">
      <div className="animate-pulse text-lg">Redirecting to AI Assistant...</div>
      <div className="mt-2 text-sm text-gray-500">
        If not redirected automatically, <a href="/assistant" className="text-blue-500 hover:underline">click here</a>
      </div>
    </div>
  );
};

export default Index;
