
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useAuditLog } from '@/hooks/useAuditLog';

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

// Helper function to get client IP (simplified)
const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
};

// Helper function to log authentication attempts
const logAuthAttempt = async (
  email: string, 
  attemptType: string, 
  success: boolean, 
  ipAddress: string
) => {
  try {
    const { error } = await supabase
      .from('auth_attempts')
      .insert({
        email,
        attempt_type: attemptType,
        success,
        ip_address: ipAddress
      });
    
    if (error) {
      console.warn('Failed to log auth attempt:', error);
    }
  } catch (err) {
    console.warn('Failed to log auth attempt:', err);
  }
};

// Helper function to check rate limits
const checkRateLimit = async (email: string, ipAddress: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('check_rate_limit', {
        p_ip_address: ipAddress,
        p_email: email,
        p_attempt_type: 'login'
      });

    if (error) {
      console.warn('Rate limit check failed:', error);
      return true; // Allow on error to prevent lockout
    }

    return data === true;
  } catch (err) {
    console.warn('Rate limit check failed:', err);
    return true; // Allow on error
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logAction } = useAuditLog();

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
          // Log successful login
          await logAction({
            action: 'LOGIN',
            table_name: 'auth',
            record_id: session.user.id,
            new_values: {
              user_id: session.user.id,
              email: session.user.email,
              timestamp: new Date().toISOString()
            }
          });

          // Redirect to /home after successful login
          navigate('/home', { replace: true });
          toast.success("Login realizado com sucesso");
        }

        if (event === 'SIGNED_OUT') {
          // Log logout
          if (user) {
            await logAction({
              action: 'LOGOUT',
              table_name: 'auth',
              record_id: user.id,
              old_values: {
                user_id: user.id,
                email: user.email,
                timestamp: new Date().toISOString()
              }
            });
          }

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
  }, [navigate, isInitialized, user, logAction]);

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Input validation
      if (!email || !password) {
        toast.error("Email e senha são obrigatórios");
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Por favor, insira um email válido");
        return;
      }

      const clientIP = await getClientIP();

      // Check rate limits
      const isAllowed = await checkRateLimit(email, clientIP);
      if (!isAllowed) {
        toast.error("Muitas tentativas de login. Tente novamente em 15 minutos.");
        await logAuthAttempt(email, 'login', false, clientIP);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Log failed attempt
        await logAuthAttempt(email, 'login', false, clientIP);
        
        if (error.message.includes('Invalid login credentials')) {
          toast.error("Email ou senha incorretos");
        } else {
          toast.error("Erro ao fazer login: " + error.message);
        }
        throw error;
      }
      
      // Log successful attempt
      await logAuthAttempt(email, 'login', true, clientIP);
      
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
      
      // Input validation
      if (!email || !password || !fullName) {
        toast.error("Todos os campos são obrigatórios");
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Por favor, insira um email válido");
        return;
      }

      // Password strength validation
      if (password.length < 6) {
        toast.error("A senha deve ter pelo menos 6 caracteres");
        return;
      }

      const clientIP = await getClientIP();

      // Check rate limits for signup
      const isAllowed = await checkRateLimit(email, clientIP);
      if (!isAllowed) {
        toast.error("Muitas tentativas de cadastro. Tente novamente em 15 minutos.");
        await logAuthAttempt(email, 'signup', false, clientIP);
        return;
      }
      
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
        // Log failed attempt
        await logAuthAttempt(email, 'signup', false, clientIP);
        
        if (error.message.includes('User already registered')) {
          toast.error("Este email já está cadastrado. Tente fazer login.");
        } else {
          toast.error("Erro ao criar conta: " + error.message);
        }
        throw error;
      } else {
        // Log successful attempt
        await logAuthAttempt(email, 'signup', true, clientIP);
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
