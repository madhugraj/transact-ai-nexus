
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  // Simplified redirect logic to prevent any loops
  useEffect(() => {
    // Direct navigation without checking session storage to avoid potential issues
    navigate("/assistant", { replace: true });
    
    // No return cleanup function needed for this simple redirect
  }, [navigate]);

  return <div className="p-8 text-center">Redirecting to AI Assistant...</div>;
};

export default Index;
