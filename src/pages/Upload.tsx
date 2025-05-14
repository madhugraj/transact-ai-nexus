
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Upload = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the Documents page with the upload tab selected
    navigate("/documents?tab=upload");
  }, [navigate]);

  return null; // This component will not render as it redirects immediately
};

export default Upload;
