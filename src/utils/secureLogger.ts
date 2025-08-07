
/**
 * Production-ready secure logging utility
 * Replaces console.log statements with environment-aware logging
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

interface LogContext {
  userId?: string;
  action?: string;
  component?: string;
  [key: string]: any;
}

class SecureLogger {
  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    // In production, only log warnings and errors
    if (isProduction) {
      return level === 'warn' || level === 'error';
    }
    
    // In development, log everything
    return isDevelopment;
  }

  private sanitizeContext(context: LogContext): LogContext {
    if (!context || typeof context !== 'object') return {};
    
    const sanitized = { ...context };
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'pin', 'credential',
      'email', 'phone', 'cpf', 'cnpj', 'address'
    ];
    
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, context ? this.sanitizeContext(context) : '');
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, context ? this.sanitizeContext(context) : '');
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, context ? this.sanitizeContext(context) : '');
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, context ? this.sanitizeContext(context) : '');
    }
  }

  security(message: string, context?: LogContext): void {
    // Security events are always logged
    console.warn(`[SECURITY] ${message}`, context ? this.sanitizeContext(context) : '');
  }
}

export const secureLogger = new SecureLogger();
