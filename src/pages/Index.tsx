
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const [redirected, setRedirected] = useState(false);

  // Redirect to assistant page on load only once with a small delay
  useEffect(() => {
    if (!redirected) {
      // Use sessionStorage as a more robust way to prevent redirect loops
      const hasAlreadyRedirected = sessionStorage.getItem('hasRedirectedFromIndex');
      
      if (!hasAlreadyRedirected) {
        // Set both local state and session storage
        setRedirected(true);
        sessionStorage.setItem('hasRedirectedFromIndex', 'true');
        
        // Small timeout to ensure we're not rapidly navigating
        const timer = setTimeout(() => {
          navigate("/assistant", { replace: true });
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, [navigate, redirected]);

  return <div>Redirecting to AI Assistant...</div>;
};

export default Index;
