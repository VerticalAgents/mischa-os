
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const getKey = (userId?: string | null) =>
  userId ? `lastVisitedRoute:${userId}` : 'lastVisitedRoute';

export default function GlobalRoutePersistence() {
  const location = useLocation();
  const { user } = useAuth();

  // Salva rota ao mudar
  useEffect(() => {
    const path = location.pathname + location.search + location.hash;
    if (
      path === '/' ||
      path === '/login' ||
      path === '/home' ||
      path.startsWith('/auth')
    ) return;

    localStorage.setItem(getKey(user?.id), path);
  }, [location.pathname, location.search, location.hash, user?.id]);

  // Fallback: salva também em visibilitychange/beforeunload
  useEffect(() => {
    const save = () => {
      const path = location.pathname + location.search + location.hash;
      if (
        path === '/' ||
        path === '/login' ||
        path === '/home' ||
        path.startsWith('/auth')
      ) return;
      
      localStorage.setItem(getKey(user?.id), path);
    };
    
    document.addEventListener('visibilitychange', save);
    window.addEventListener('beforeunload', save);
    
    return () => {
      document.removeEventListener('visibilitychange', save);
      window.removeEventListener('beforeunload', save);
    };
  }, [location.pathname, location.search, location.hash, user?.id]);

  return null;
}
