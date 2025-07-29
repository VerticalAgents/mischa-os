
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSupabaseInterceptor = () => {
  const { refreshSession, isSessionValid, logout } = useAuth();

  useEffect(() => {
    // Store original fetch
    const originalFetch = window.fetch;

    // Create interceptor
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        // Check session before making request
        if (!isSessionValid()) {
          console.log('Session invalid, attempting refresh...');
          const refreshed = await refreshSession();
          if (!refreshed) {
            console.log('Session refresh failed, redirecting to login');
            logout();
            return Promise.reject(new Error('Session expired'));
          }
        }

        const response = await originalFetch(input, init);
        
        // Handle auth errors
        if (response.status === 401 || response.status === 403) {
          console.log('Auth error detected, attempting session refresh...');
          const refreshed = await refreshSession();
          
          if (refreshed) {
            // Retry the original request with new session
            return originalFetch(input, init);
          } else {
            console.log('Session refresh failed, logging out...');
            logout();
            toast.error('Sessão expirada. Faça login novamente.');
            return Promise.reject(new Error('Authentication failed'));
          }
        }

        return response;
      } catch (error) {
        console.error('Request interceptor error:', error);
        throw error;
      }
    };

    // Cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, [refreshSession, isSessionValid, logout]);
};
