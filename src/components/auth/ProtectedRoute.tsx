
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, session, refreshSession } = useAuth();
  const location = useLocation();

  // Check if session is about to expire
  useEffect(() => {
    if (session) {
      const checkExpiry = () => {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = session.expires_at || 0;
        const timeUntilExpiry = expiresAt - now;

        // If token expires in less than 5 minutes, try to refresh
        if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
          console.log('Token expiring soon in ProtectedRoute, attempting refresh');
          refreshSession();
        }
      };

      checkExpiry();
      const interval = setInterval(checkExpiry, 60 * 1000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [session, refreshSession]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
