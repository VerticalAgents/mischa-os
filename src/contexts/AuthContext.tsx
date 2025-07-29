
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
  refreshSession: () => Promise<void>;
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

// Helper function to log audit events
const logAuditEvent = async (
  userId: string,
  action: string,
  table_name?: string,
  record_id?: string,
  old_values?: Record<string, any>,
  new_values?: Record<string, any>
) => {
  try {
    const userAgent = navigator.userAgent;
    const ipAddress = await getClientIP();
    
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        user_agent: userAgent,
        ip_address: ipAddress
      });

    if (error) {
      console.error('Error logging audit entry:', error);
    }
  } catch (err) {
    console.error('Error logging audit entry:', err);
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
      return true;
    }

    return data === true;
  } catch (err) {
    console.warn('Rate limit check failed:', err);
    return true;
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const navigate = useNavigate();

  // Função para renovar sessão
  const refreshSession = async () => {
    try {
      console.log('AuthContext: Tentando renovar sessão...');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('AuthContext: Erro ao renovar sessão:', error);
        // Se não conseguir renovar, fazer logout
        await logout();
        return;
      }

      if (session) {
        console.log('AuthContext: Sessão renovada com sucesso');
        setSession(session);
        setUser(session.user);
      }
    } catch (error) {
      console.error('AuthContext: Erro inesperado ao renovar sessão:', error);
      await logout();
    }
  };

  // Função para verificar se a sessão está prestes a expirar
  const checkSessionExpiry = (session: Session) => {
    if (!session) return;

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    const timeUntilExpiry = expiresAt - now;

    console.log(`AuthContext: Sessão expira em ${timeUntilExpiry} segundos`);

    // Se faltam menos de 5 minutos (300 segundos) para expirar, renovar
    if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
      console.log('AuthContext: Renovando sessão preventivamente...');
      refreshSession();
    }
    // Se já expirou, fazer logout
    else if (timeUntilExpiry <= 0) {
      console.log('AuthContext: Sessão expirada, fazendo logout...');
      logout();
    }
  };

  // Interceptar erros de JWT
  const handleSupabaseError = (error: any) => {
    if (error?.message?.includes('JWT expired') || error?.code === 'PGRST301') {
      console.log('AuthContext: JWT expirado detectado, renovando sessão...');
      toast.error('Sessão expirada. Renovando automaticamente...');
      refreshSession();
      return true;
    }
    return false;
  };

  useEffect(() => {
    console.log('AuthContext: Inicializando autenticação...');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state change:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session) {
          // Verificar se a sessão está prestes a expirar
          checkSessionExpiry(session);
        }

        // Only process events after initialization
        if (!isInitialized) {
          setIsInitialized(true);
          return;
        }

        if (event === 'SIGNED_IN' && session) {
          // Log successful login
          setTimeout(() => {
            logAuditEvent(
              session.user.id,
              'LOGIN',
              'auth',
              session.user.id,
              undefined,
              {
                user_id: session.user.id,
                email: session.user.email,
                timestamp: new Date().toISOString()
              }
            );
          }, 0);

          navigate('/home', { replace: true });
          toast.success("Login realizado com sucesso");
        }

        if (event === 'SIGNED_OUT') {
          // Log logout
          if (user) {
            setTimeout(() => {
              logAuditEvent(
                user.id,
                'LOGOUT',
                'auth',
                user.id,
                {
                  user_id: user.id,
                  email: user.email,
                  timestamp: new Date().toISOString()
                }
              );
            }, 0);
          }

          navigate('/login');
          toast.info("Você foi desconectado");
        }

        if (event === 'TOKEN_REFRESHED' && session) {
          console.log('AuthContext: Token renovado automaticamente');
          toast.success("Sessão renovada automaticamente");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('AuthContext: Erro ao obter sessão:', error);
        handleSupabaseError(error);
      }
      
      console.log('AuthContext: Sessão inicial:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setIsInitialized(true);

      if (session) {
        checkSessionExpiry(session);
      }
    });

    // Set up periodic session check (every 2 minutes)
    const sessionCheckInterval = setInterval(() => {
      if (session) {
        checkSessionExpiry(session);
      }
    }, 2 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(sessionCheckInterval);
    };
  }, [navigate, isInitialized, user]);

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      
      if (!email || !password) {
        toast.error("Email e senha são obrigatórios");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Por favor, insira um email válido");
        return;
      }

      const clientIP = await getClientIP();

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
        await logAuthAttempt(email, 'login', false, clientIP);
        
        if (error.message.includes('Invalid login credentials')) {
          toast.error("Email ou senha incorretos");
        } else {
          toast.error("Erro ao fazer login: " + error.message);
        }
        throw error;
      }
      
      await logAuthAttempt(email, 'login', true, clientIP);
      
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
      
      if (!email || !password || !fullName) {
        toast.error("Todos os campos são obrigatórios");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Por favor, insira um email válido");
        return;
      }

      if (password.length < 6) {
        toast.error("A senha deve ter pelo menos 6 caracteres");
        return;
      }

      const clientIP = await getClientIP();

      const isAllowed = await checkRateLimit(email, clientIP);
      if (!isAllowed) {
        toast.error("Muitas tentativas de cadastro. Tente novamente em 15 minutos.");
        await logAuthAttempt(email, 'signup', false, clientIP);
        return;
      }
      
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
        await logAuthAttempt(email, 'signup', false, clientIP);
        
        if (error.message.includes('User already registered')) {
          toast.error("Este email já está cadastrado. Tente fazer login.");
        } else {
          toast.error("Erro ao criar conta: " + error.message);
        }
        throw error;
      } else {
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
      console.log('AuthContext: Fazendo logout...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthContext: Erro ao fazer logout:', error);
        toast.error("Erro ao fazer logout: " + error.message);
      }
    } catch (error) {
      console.error('AuthContext: Erro inesperado ao fazer logout:', error);
      toast.error("Erro inesperado ao fazer logout");
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!session;

  // Expose handleSupabaseError globally for use in other components
  useEffect(() => {
    (window as any).handleSupabaseError = handleSupabaseError;
    return () => {
      delete (window as any).handleSupabaseError;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      session, 
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      logout, 
      loading,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};
