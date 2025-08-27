import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface RouteProtectionOptions {
  enabled?: boolean;
  debugMode?: boolean;
}

/**
 * Hook para proteger rotas contra redirecionamentos indevidos
 * Previne que o sistema redirecione automaticamente quando o usuário está navegando
 */
export const useRouteProtection = (options: RouteProtectionOptions = {}) => {
  const { enabled = true, debugMode = false } = options;
  const location = useLocation();
  const navigate = useNavigate();
  const isProtectedRef = useRef(false);
  const lastLocationRef = useRef(location.pathname);

  useEffect(() => {
    if (!enabled) return;

    const currentPath = location.pathname;
    
    // Se mudou de rota, significa que o usuário navegou intencionalmente
    if (currentPath !== lastLocationRef.current) {
      isProtectedRef.current = true;
      lastLocationRef.current = currentPath;
      
      if (debugMode) {
        console.log('🛡️ RouteProtection: Rota protegida -', currentPath);
      }

      // Salvar a rota atual válida
      if (!isExcludedRoute(currentPath)) {
        localStorage.setItem('lastVisitedRoute', currentPath + location.search + location.hash);
        
        if (debugMode) {
          console.log('💾 RouteProtection: Rota salva -', currentPath);
        }
      }
      
      // Desproteger após um tempo para permitir redirecionamentos necessários
      const timeout = setTimeout(() => {
        isProtectedRef.current = false;
        if (debugMode) {
          console.log('🔓 RouteProtection: Proteção removida');
        }
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [location.pathname, location.search, location.hash, enabled, debugMode]);

  const isProtected = () => isProtectedRef.current;

  const allowRedirect = () => {
    isProtectedRef.current = false;
    if (debugMode) {
      console.log('✅ RouteProtection: Redirecionamento permitido');
    }
  };

  const forceProtect = () => {
    isProtectedRef.current = true;
    if (debugMode) {
      console.log('🔒 RouteProtection: Proteção forçada');
    }
  };

  return {
    isProtected,
    allowRedirect,
    forceProtect
  };
};

const isExcludedRoute = (path: string): boolean => {
  const excludedRoutes = ['/', '/home', '/auth', '/login'];
  return excludedRoutes.includes(path) || path.startsWith('/auth');
};