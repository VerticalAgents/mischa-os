
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Session,
  User,
  AuthChangeEvent,
} from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextProps>({
  session: null,
  user: null,
  loading: false,
  isAuthenticated: false,
  signIn: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  logout: async () => {},
  refreshSession: async () => {},
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
      toast('Verifique seu email para o link de login mágico!');
    } catch (error: any) {
      toast(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      toast(error.error_description || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast(error.error_description || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast(error.error_description || error.message);
      throw error;
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
      toast('Logout realizado com sucesso');
    } catch (error: any) {
      toast(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = signOut;

  const refreshSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;
    } catch (error: any) {
      throw error;
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
          
          toast("Login realizado com sucesso");
        }

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          navigate('/login');
          toast("Logout realizado com sucesso");
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
    isAuthenticated: !!session,
    signIn,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    logout,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
