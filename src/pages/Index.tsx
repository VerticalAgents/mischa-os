
import { Navigate } from "react-router-dom";

// Redirect to dashboard
const Index = () => {
  return <Navigate to="/analytics" replace />;
};

export default Index;
