
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseInterceptor } from '@/hooks/useSupabaseInterceptor';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, isSessionValid, refreshSession } = useAuth();
  const location = useLocation();
  
  // Initialize Supabase interceptor
  useSupabaseInterceptor();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if session is valid, if not try to refresh
  if (!isSessionValid()) {
    console.log('Session invalid in ProtectedRoute, attempting refresh...');
    refreshSession().then((success) => {
      if (!success) {
        console.log('Session refresh failed in ProtectedRoute');
      }
    });
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
