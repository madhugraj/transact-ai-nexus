
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  // Redirect to assistant page on load only once
  useEffect(() => {
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      navigate("/assistant", { replace: true });
    }
  }, [navigate]);

  return <div>Redirecting to AI Assistant...</div>;
};

export default Index;
