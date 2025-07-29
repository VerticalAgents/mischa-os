
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { securityMonitoring } from '@/services/securityMonitoring';
import { CSRFProtection } from '@/utils/csrfProtection';
import { EnhancedInputValidator } from '@/utils/enhancedInputValidation';

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

// Helper function to log audit events without circular dependency
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

// Enhanced helper function to check rate limits
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

    // Monitor rate limit violations
    if (data === false) {
      await securityMonitoring.monitorRateLimitViolation('login', ipAddress);
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

  // Function to refresh session
  const refreshSession = async () => {
    try {
      console.log('Attempting to refresh session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh failed:', error);
        // If refresh fails, redirect to login
        navigate('/login');
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }
      
      if (data.session) {
        console.log('Session refreshed successfully');
        setSession(data.session);
        setUser(data.session.user);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      navigate('/login');
      toast.error("Erro ao renovar sessão. Faça login novamente.");
    }
  };

  // Check if token is about to expire and refresh if needed
  const checkTokenExpiry = async (currentSession: Session | null) => {
    if (!currentSession) return;

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = currentSession.expires_at || 0;
    const timeUntilExpiry = expiresAt - now;

    // If token expires in less than 5 minutes, refresh it
    if (timeUntilExpiry < 300) {
      console.log('Token expiring soon, refreshing...');
      await refreshSession();
    }
  };

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Clear any existing refresh interval
        if (refreshInterval) {
          clearInterval(refreshInterval);
        }

        // Only process events after initialization
        if (!isInitialized) {
          setIsInitialized(true);
          return;
        }

        if (event === 'SIGNED_IN' && session) {
          // Log successful login
          await logAuditEvent(
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

          // Set up token refresh interval (check every 5 minutes)
          refreshInterval = setInterval(() => {
            checkTokenExpiry(session);
          }, 5 * 60 * 1000);

          // Redirect to /home after successful login
          navigate('/home', { replace: true });
          toast.success("Login realizado com sucesso");
        }

        if (event === 'SIGNED_OUT') {
          // Log logout
          if (user) {
            await logAuditEvent(
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
          }

          // Clear refresh interval
          if (refreshInterval) {
            clearInterval(refreshInterval);
          }

          navigate('/login');
          toast.info("Você foi desconectado");
        }

        if (event === 'TOKEN_REFRESHED' && session) {
          console.log('Token refreshed successfully');
          setSession(session);
          setUser(session.user);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session ? 'Session found' : 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setIsInitialized(true);

      // If there's a valid session, set up token refresh monitoring
      if (session) {
        refreshInterval = setInterval(() => {
          checkTokenExpiry(session);
        }, 5 * 60 * 1000);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [navigate, isInitialized, user]);

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Enhanced input validation
      const emailValidation = EnhancedInputValidator.validateEmail(email);
      if (!emailValidation.isValid) {
        toast.error(emailValidation.errors[0]);
        return;
      }

      const passwordValidation = EnhancedInputValidator.validatePassword(password);
      if (!passwordValidation.isValid) {
        toast.error("Senha não atende aos requisitos de segurança");
        return;
      }

      const clientIP = await getClientIP();

      // Check rate limits
      const isAllowed = await checkRateLimit(emailValidation.sanitizedValue!, clientIP);
      if (!isAllowed) {
        toast.error("Muitas tentativas de login. Tente novamente em 15 minutos.");
        await securityMonitoring.monitorAuthAttempt(emailValidation.sanitizedValue!, false, 'login');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: emailValidation.sanitizedValue!,
        password
      });

      if (error) {
        // Monitor failed attempt
        await securityMonitoring.monitorAuthAttempt(emailValidation.sanitizedValue!, false, 'login');
        
        if (error.message.includes('Invalid login credentials')) {
          toast.error("Email ou senha incorretos");
        } else {
          toast.error("Erro ao fazer login: " + error.message);
        }
        throw error;
      }
      
      // Monitor successful attempt
      await securityMonitoring.monitorAuthAttempt(emailValidation.sanitizedValue!, true, 'login');
      
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
      
      // Enhanced input validation
      const emailValidation = EnhancedInputValidator.validateEmail(email);
      if (!emailValidation.isValid) {
        toast.error(emailValidation.errors[0]);
        return;
      }

      const passwordValidation = EnhancedInputValidator.validatePassword(password);
      if (!passwordValidation.isValid) {
        toast.error(passwordValidation.errors[0]);
        return;
      }

      const nameValidation = EnhancedInputValidator.sanitizeText(fullName, 100);
      if (!nameValidation.isValid) {
        toast.error(nameValidation.errors[0]);
        return;
      }

      const clientIP = await getClientIP();

      // Check rate limits for signup
      const isAllowed = await checkRateLimit(emailValidation.sanitizedValue!, clientIP);
      if (!isAllowed) {
        toast.error("Muitas tentativas de cadastro. Tente novamente em 15 minutos.");
        await securityMonitoring.monitorAuthAttempt(emailValidation.sanitizedValue!, false, 'signup');
        return;
      }
      
      // Get current origin for redirect
      const redirectTo = `${window.location.origin}/home`;
      
      const { error } = await supabase.auth.signUp({
        email: emailValidation.sanitizedValue!,
        password,
        options: {
          data: {
            full_name: nameValidation.sanitizedValue!
          },
          emailRedirectTo: redirectTo
        }
      });

      if (error) {
        // Monitor failed attempt
        await securityMonitoring.monitorAuthAttempt(emailValidation.sanitizedValue!, false, 'signup');
        
        if (error.message.includes('User already registered')) {
          toast.error("Este email já está cadastrado. Tente fazer login.");
        } else {
          toast.error("Erro ao criar conta: " + error.message);
        }
        throw error;
      } else {
        // Monitor successful attempt
        await securityMonitoring.monitorAuthAttempt(emailValidation.sanitizedValue!, true, 'signup');
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
      loading,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};
