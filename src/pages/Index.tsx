import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const auth = localStorage.getItem("apgs-auth");
    navigate(auth ? "/dashboard" : "/login");
  }, [navigate]);
  return null;
};

export default Index;
