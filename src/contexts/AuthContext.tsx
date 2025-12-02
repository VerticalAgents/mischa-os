import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { secureLogger } from '@/utils/secureLogger';
import { getClientIP, logSecurityEvent } from '@/utils/secureIpDetection';

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
      secureLogger.warn('Failed to log auth attempt', { error });
    }
  } catch (err) {
    secureLogger.warn('Failed to log auth attempt', { error: err });
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
      secureLogger.error('Error logging audit entry', { error });
    }
  } catch (err) {
    secureLogger.error('Error logging audit entry', { error: err });
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
      secureLogger.warn('Rate limit check failed', { error });
      return true;
    }

    return data === true;
  } catch (err) {
    secureLogger.warn('Rate limit check failed', { error: err });
    return true;
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const navigate = useNavigate();
  
  // Refs para evitar loops infinitos em useEffects
  const userRef = useRef<User | null>(null);
  const sessionRef = useRef<Session | null>(null);
  
  // Manter refs atualizados
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Função para renovar sessão
  const refreshSession = async () => {
    try {
      secureLogger.debug('Attempting to refresh session');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        secureLogger.error('Error refreshing session', { error });
        // Se não conseguir renovar, fazer logout
        await logout();
        return;
      }

      if (session) {
        secureLogger.info('Session refreshed successfully');
        setSession(session);
        setUser(session.user);
      }
    } catch (error) {
      secureLogger.error('Unexpected error refreshing session', { error });
      await logout();
    }
  };

  // Função para verificar se a sessão está prestes a expirar
  const checkSessionExpiry = (session: Session) => {
    if (!session) return;

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    const timeUntilExpiry = expiresAt - now;

    secureLogger.debug('Session expiry check', { timeUntilExpiry });

    // Se faltam menos de 5 minutos (300 segundos) para expirar, renovar
    if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
      secureLogger.info('Refreshing session preventively');
      refreshSession();
    }
    // Se já expirou, fazer logout
    else if (timeUntilExpiry <= 0) {
      secureLogger.warn('Session expired, logging out');
      logout();
    }
  };

  // Interceptar erros de JWT
  const handleSupabaseError = (error: any) => {
    if (error?.message?.includes('JWT expired') || error?.code === 'PGRST301') {
      secureLogger.warn('JWT expired detected, refreshing session');
      toast.error('Sessão expirada. Renovando automaticamente...');
      refreshSession();
      return true;
    }
    return false;
  };

  useEffect(() => {
    secureLogger.info('Initializing authentication context');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        secureLogger.info('Auth state change', { event, userEmail: session?.user?.email });
        
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
            
            logSecurityEvent('USER_LOGIN', {
              user_id: session.user.id,
              email: session.user.email
            }, session.user.id);
          }, 0);

          // REMOVIDO: navigate('/home', { replace: true }); 
          // O redirecionamento será feito pelo Index.tsx
          toast.success("Login realizado com sucesso");
        }

        if (event === 'SIGNED_OUT') {
          // Log logout - usar ref para evitar dependência de estado
          const currentUser = userRef.current;
          if (currentUser) {
            setTimeout(() => {
              logAuditEvent(
                currentUser.id,
                'LOGOUT',
                'auth',
                currentUser.id,
                {
                  user_id: currentUser.id,
                  email: currentUser.email,
                  timestamp: new Date().toISOString()
                }
              );
              
              logSecurityEvent('USER_LOGOUT', {
                user_id: currentUser.id,
                email: currentUser.email
              }, currentUser.id);
            }, 0);
          }

          // Limpar rota salva no logout
          localStorage.removeItem('lastVisitedRoute');
          navigate('/login');
          toast.info("Você foi desconectado");
        }

        if (event === 'TOKEN_REFRESHED' && session) {
          secureLogger.info('Token refreshed automatically');
          toast.success("Sessão renovada automaticamente");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        secureLogger.error('Error getting initial session', { error });
        handleSupabaseError(error);
      }
      
      secureLogger.debug('Initial session loaded', { userEmail: session?.user?.email });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setIsInitialized(true);

      if (session) {
        checkSessionExpiry(session);
      }
    });

    // Set up periodic session check (every 2 minutes) - usar ref para evitar recriação
    const sessionCheckInterval = setInterval(() => {
      const currentSession = sessionRef.current;
      if (currentSession) {
        checkSessionExpiry(currentSession);
      }
    }, 2 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(sessionCheckInterval);
    };
  }, [navigate, isInitialized]); // Removido 'user' das dependências

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
        await logSecurityEvent('RATE_LIMIT_EXCEEDED', { email, ip: clientIP });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        await logAuthAttempt(email, 'login', false, clientIP);
        await logSecurityEvent('LOGIN_FAILED', { email, error: error.message });
        
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
        await logSecurityEvent('SIGNUP_FAILED', { email, error: error.message });
        
        if (error.message.includes('User already registered')) {
          toast.error("Este email já está cadastrado. Tente fazer login.");
        } else {
          toast.error("Erro ao criar conta: " + error.message);
        }
        throw error;
      } else {
        await logAuthAttempt(email, 'signup', true, clientIP);
        await logSecurityEvent('USER_SIGNUP', { email });
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
        await logSecurityEvent('OAUTH_LOGIN_FAILED', { provider: 'google', error: error.message });
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
      secureLogger.info('Logging out user');
      const { error } = await supabase.auth.signOut();
      if (error) {
        secureLogger.error('Error during logout', { error });
        toast.error("Erro ao fazer logout: " + error.message);
      }
    } catch (error) {
      secureLogger.error('Unexpected error during logout', { error });
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
