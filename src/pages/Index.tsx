
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  // One-time redirect with strict redirect guard
  useEffect(() => {
    // Check if we've redirected from this component during this session
    const hasRedirected = sessionStorage.getItem('indexRedirectComplete');
    
    if (!hasRedirected) {
      // Set the flag before attempting navigation to prevent any possibility of loops
      sessionStorage.setItem('indexRedirectComplete', 'true');
      
      // Use a small timeout to ensure the sessionStorage flag is set
      const timer = setTimeout(() => {
        navigate("/assistant", { replace: true });
      }, 300);
      
      return () => clearTimeout(timer);
    }
    
    // If we've already redirected, do nothing
    console.info("Index page: already redirected previously, not redirecting again");
  }, [navigate]);

  return <div className="p-8 text-center">Redirecting to AI Assistant...</div>;
};

export default Index;
