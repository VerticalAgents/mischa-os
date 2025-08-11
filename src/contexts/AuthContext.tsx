import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Session,
  User,
  AuthChangeEvent,
} from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextProps>({
  session: null,
  user: null,
  loading: false,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getSession = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        setSession(session);
        setUser(session?.user || null);
      } catch (error: any) {
        console.error('Error during getSession:', error.message);
      } finally {
        setLoading(false);
      }
    }

    getSession();
  }, []);

  const signIn = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      toast.success('Verifique seu email para o link de login mágico!');
    } catch (error: any) {
      toast.error(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      navigate('/login');
      toast.success('Logout realizado com sucesso');
    } catch (error: any) {
      toast.error(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          setLoading(false);
          
          // Respeita última rota salva se estivermos vindo de /, /login ou /auth
          const key = session.user?.id ? `lastVisitedRoute:${session.user.id}` : 'lastVisitedRoute';
          const saved = localStorage.getItem(key) || localStorage.getItem('lastVisitedRoute');
          const isAuthArea = location.pathname === '/' || location.pathname === '/login' || location.pathname.startsWith('/auth');
          
          if (isAuthArea) {
            const target = saved 
              && saved !== '/' 
              && saved !== '/home' 
              && !saved.startsWith('/auth') 
              ? saved 
              : '/home';
            navigate(target, { replace: true });
          }
          
          toast.success("Login realizado com sucesso");
        }

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          navigate('/login');
          toast.success("Logout realizado com sucesso");
        }

        if (event === 'USER_UPDATED') {
          setUser(session?.user || null);
        }

        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  const value: AuthContextProps = {
    session,
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
