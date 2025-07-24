
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Only process events after initialization
        if (!isInitialized) {
          setIsInitialized(true);
          return;
        }

        if (event === 'SIGNED_IN' && session) {
          // Redirect to /home after successful login
          navigate('/home', { replace: true });
          toast.success("Login realizado com sucesso");
        }

        if (event === 'SIGNED_OUT') {
          navigate('/login');
          toast.info("Você foi desconectado");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setIsInitialized(true);
    });

    return () => subscription.unsubscribe();
  }, [navigate, isInitialized]);

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error("Email ou senha incorretos");
        } else {
          toast.error("Erro ao fazer login: " + error.message);
        }
        throw error;
      }
      
      // Redirection will be handled by onAuthStateChange
    } catch (error) {
      if (error instanceof Error && !error.message.includes('Invalid login credentials')) {
        toast.error("Erro inesperado ao fazer login");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Get current origin for redirect
      const redirectTo = `${window.location.origin}/home`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          },
          emailRedirectTo: redirectTo
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error("Este email já está cadastrado. Tente fazer login.");
        } else {
          toast.error("Erro ao criar conta: " + error.message);
        }
        throw error;
      } else {
        toast.success("Conta criada com sucesso! Verifique seu email para confirmar.");
      }
    } catch (error) {
      if (error instanceof Error && !error.message.includes('User already registered')) {
        toast.error("Erro inesperado ao criar conta");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`
        }
      });

      if (error) {
        toast.error("Erro ao fazer login com Google: " + error.message);
      }
    } catch (error) {
      toast.error("Erro inesperado ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Erro ao fazer logout: " + error.message);
      }
    } catch (error) {
      toast.error("Erro inesperado ao fazer logout");
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!session;

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      session, 
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      logout, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
