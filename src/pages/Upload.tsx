
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Upload = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to documents page with upload tab
    navigate("/documents?tab=upload");
  }, [navigate]);

  return null;
};

export default Upload;
