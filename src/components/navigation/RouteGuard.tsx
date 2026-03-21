import { ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useMyPermissions } from '@/hooks/useRolePermissions';

interface RouteGuardProps {
  children: ReactNode;
}

// Routes that don't need permission checks
const PUBLIC_ROUTES = ['/', '/auth', '/login', '/home'];

function pathMatchesRoute(pathname: string, routeKey: string): boolean {
  if (pathname === routeKey) return true;
  const basePath = pathname.split('?')[0];
  return basePath === routeKey || basePath.startsWith(routeKey + '/');
}

export const RouteGuard = ({ children }: RouteGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { userRole, loading: roleLoading } = useUserRoles();
  const { allowedRoutes, loading: permLoading } = useMyPermissions();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for all loading to finish
    if (authLoading || roleLoading || permLoading) return;
    if (!user) return;

    const pathname = location.pathname;

    // Skip guard for public/common routes
    if (PUBLIC_ROUTES.includes(pathname)) return;

    // Admin has full access
    if (userRole === 'admin') return;

    // Check if current route is in allowed routes
    const hasAccess = allowedRoutes.some(route => pathMatchesRoute(pathname, route));

    if (!hasAccess && allowedRoutes.length > 0) {
      // Redirect to first allowed route or /home
      navigate(allowedRoutes[0] || '/home', { replace: true });
    } else if (!hasAccess && allowedRoutes.length === 0) {
      navigate('/home', { replace: true });
    }
  }, [user, authLoading, roleLoading, permLoading, userRole, allowedRoutes, location.pathname, navigate]);

  return <>{children}</>;
};
