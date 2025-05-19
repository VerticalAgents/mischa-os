
import { Navigate } from "react-router-dom";

// Redirect to analytics dashboard
const Index = () => {
  return <Navigate to="/analytics" replace />;
};

export default Index;
