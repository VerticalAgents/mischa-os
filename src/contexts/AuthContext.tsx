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
  refreshSession: () => Promise<boolean>;
  isSessionValid: () => boolean;
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
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if session is valid (not expired)
  const isSessionValid = (): boolean => {
    if (!session) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    
    // Consider session invalid if it expires in less than 5 minutes
    return expiresAt > (now + 300);
  };

  // Refresh session function
  const refreshSession = async (): Promise<boolean> => {
    try {
      console.log('Refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh failed:', error);
        return false;
      }
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        console.log('Session refreshed successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Session refresh error:', error);
      return false;
    }
  };

  // Setup automatic token refresh
  const setupTokenRefresh = (session: Session) => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }

    if (!session.expires_at) return;

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;
    
    // Refresh 5 minutes before expiration
    const refreshTime = (expiresAt - now - 300) * 1000;
    
    if (refreshTime > 0) {
      const timer = setTimeout(async () => {
        const refreshed = await refreshSession();
        if (!refreshed) {
          // If refresh fails, redirect to login
          navigate('/login');
          toast.error('Sessão expirada. Faça login novamente.');
        }
      }, refreshTime);
      
      setRefreshTimer(timer);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Setup automatic token refresh for new sessions
        if (session && event === 'SIGNED_IN') {
          setupTokenRefresh(session);
        }

        // Clear refresh timer on sign out
        if (event === 'SIGNED_OUT' && refreshTimer) {
          clearTimeout(refreshTimer);
          setRefreshTimer(null);
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

          navigate('/login');
          toast.info("Você foi desconectado");
        }

        if (event === 'TOKEN_REFRESHED' && session) {
          console.log('Token refreshed automatically');
          setupTokenRefresh(session);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setIsInitialized(true);
      
      // Setup token refresh for existing session
      if (session) {
        setupTokenRefresh(session);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, [navigate, isInitialized, user, refreshTimer]);

  // Retry wrapper for auth operations
  const retryOperation = async <T,>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
    throw new Error('Max retries exceeded');
  };

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

      // Retry login operation
      await retryOperation(async () => {
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
      });
      
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
      
      // Clear refresh timer
      if (refreshTimer) {
        clearTimeout(refreshTimer);
        setRefreshTimer(null);
      }
      
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
      refreshSession,
      isSessionValid
    }}>
      {children}
    </AuthContext.Provider>
  );
};
