import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";

interface RepGuardProps {
  children: ReactNode;
}

/**
 * Garante que somente usuários com o role `representante` acessem rotas /rep/*.
 * Não-representantes são redirecionados para /home.
 */
export function RepGuard({ children }: RepGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { userRole, loading: roleLoading } = useUserRoles();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (userRole !== "representante") {
      navigate("/home", { replace: true });
    }
  }, [user, userRole, authLoading, roleLoading, navigate, location.pathname]);

  if (authLoading || roleLoading || !user || userRole !== "representante") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return <>{children}</>;
}