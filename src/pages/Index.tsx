
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  // Redirect to assistant page on load
  useEffect(() => {
    navigate("/assistant");
  }, [navigate]);

  return <div>Redirecting to AI Assistant...</div>;
};

export default Index;
