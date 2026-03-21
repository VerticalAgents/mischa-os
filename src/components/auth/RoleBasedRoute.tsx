
import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import { toast } from 'sonner';

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles: AppRole[];
}

export function RoleBasedRoute({ children, allowedRoles }: RoleBasedRouteProps) {
  const { userRole, loading } = useUserRoles();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !allowedRoles.includes(userRole)) {
      toast.error('Acesso não autorizado');
      navigate('/home', { replace: true });
    }
  }, [userRole, loading, allowedRoles, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!allowedRoles.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
}
