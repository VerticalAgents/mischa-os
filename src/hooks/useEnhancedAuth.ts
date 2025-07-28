
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { InputValidator } from '@/utils/inputValidation';
import { logger } from '@/utils/logger';

interface AuthAttempt {
  ip_address: string;
  email?: string;
  attempt_type: string;
  success: boolean;
}

interface SecurityEvent {
  event_type: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  details: Record<string, any>;
}

export function useEnhancedAuth() {
  const { user } = useAuth();
  const { logAction } = useAuditLog();
  const [authAttempts, setAuthAttempts] = useState<AuthAttempt[]>([]);
  const [accountLocked, setAccountLocked] = useState(false);
  const [lockoutExpiry, setLockoutExpiry] = useState<Date | null>(null);

  // Get client IP (simplified for demo)
  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || '127.0.0.1';
    } catch {
      return '127.0.0.1';
    }
  };

  // Log authentication attempts
  const logAuthAttempt = async (email: string, success: boolean, attemptType: string = 'login') => {
    try {
      const ipAddress = await getClientIP();
      
      const { error } = await supabase
        .from('auth_attempts')
        .insert({
          ip_address: ipAddress,
          email,
          attempt_type: attemptType,
          success
        });

      if (error) {
        logger.error('Failed to log auth attempt:', error);
      }

      // Check rate limiting
      if (!success) {
        const { data: rateLimitOk } = await supabase
          .rpc('check_rate_limit', {
            p_ip_address: ipAddress,
            p_email: email,
            p_attempt_type: attemptType
          });

        if (!rateLimitOk) {
          setAccountLocked(true);
          setLockoutExpiry(new Date(Date.now() + 15 * 60 * 1000)); // 15 minutes
          
          await logSecurityEvent('ACCOUNT_LOCKED', 'WARNING', {
            email,
            ip_address: ipAddress,
            reason: 'Too many failed attempts'
          });
        }
      }
    } catch (error) {
      logger.error('Error logging auth attempt:', error);
    }
  };

  // Log security events using audit logs
  const logSecurityEvent = async (eventType: string, severity: SecurityEvent['severity'], details: Record<string, any>) => {
    try {
      await logAction({
        action: 'SECURITY_EVENT',
        table_name: 'security_events',
        new_values: {
          event_type: eventType,
          severity: severity,
          details: details
        }
      });
    } catch (error) {
      logger.error('Error logging security event:', error);
    }
  };

  // Enhanced password validation
  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const result = InputValidator.validatePassword(password);
    
    // Additional security checks
    const additionalErrors: string[] = [];
    
    // Check for common weak passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'admin'];
    if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
      additionalErrors.push('Senha contém padrões comuns - use uma senha mais segura');
    }
    
    // Check for sequential characters
    if (/123|abc|qwe/i.test(password)) {
      additionalErrors.push('Evite sequências de caracteres na senha');
    }
    
    return {
      isValid: result.isValid && additionalErrors.length === 0,
      errors: [...result.errors, ...additionalErrors]
    };
  };

  // Enhanced email validation
  const validateEmail = (email: string): { isValid: boolean; errors: string[] } => {
    const result = InputValidator.validateEmail(email);
    
    // Additional security checks
    const additionalErrors: string[] = [];
    
    // Check for disposable email domains
    const disposableDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && disposableDomains.includes(domain)) {
      additionalErrors.push('Email temporário não é permitido');
    }
    
    return {
      isValid: result.isValid && additionalErrors.length === 0,
      errors: [...result.errors, ...additionalErrors]
    };
  };

  // Check if account is locked
  const checkAccountLockout = (): boolean => {
    if (accountLocked && lockoutExpiry) {
      if (new Date() > lockoutExpiry) {
        setAccountLocked(false);
        setLockoutExpiry(null);
        return false;
      }
      return true;
    }
    return false;
  };

  // Monitor suspicious activities
  const monitorSuspiciousActivity = async () => {
    if (!user) return;

    try {
      // Check for multiple sessions
      const { data: sessions } = await supabase.auth.getSession();
      if (sessions) {
        logger.debug('Active session detected for user:', user.id);
      }

      // Log user activity
      await logAction({
        action: 'USER_ACTIVITY_CHECK',
        table_name: 'security_monitoring',
        new_values: {
          user_id: user.id,
          timestamp: new Date().toISOString(),
          activity_type: 'session_check'
        }
      });

    } catch (error) {
      logger.error('Error monitoring suspicious activity:', error);
    }
  };

  // Setup periodic security monitoring
  useEffect(() => {
    if (user) {
      const interval = setInterval(monitorSuspiciousActivity, 5 * 60 * 1000); // Every 5 minutes
      return () => clearInterval(interval);
    }
  }, [user]);

  return {
    logAuthAttempt,
    logSecurityEvent,
    validatePassword,
    validateEmail,
    checkAccountLockout,
    accountLocked,
    lockoutExpiry,
    authAttempts
  };
}
