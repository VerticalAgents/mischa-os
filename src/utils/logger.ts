
/**
 * Secure logging utility that respects environment settings
 * and prevents sensitive information from being logged in production
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

class SecureLogger {
  private shouldLog(level: keyof LogLevel): boolean {
    // In production, only log warnings and errors
    if (isProduction) {
      return level === 'WARN' || level === 'ERROR';
    }
    
    // In development, log everything
    return isDevelopment;
  }

  private sanitizeData(data: any): any {
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      
      // Remove sensitive fields
      const sensitiveFields = ['password', 'token', 'secret', 'key', 'pin', 'credential'];
      sensitiveFields.forEach(field => {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
        }
      });
      
      return sanitized;
    }
    
    return data;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('DEBUG')) {
      console.log(`[DEBUG] ${message}`, data ? this.sanitizeData(data) : '');
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('INFO')) {
      console.info(`[INFO] ${message}`, data ? this.sanitizeData(data) : '');
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('WARN')) {
      console.warn(`[WARN] ${message}`, data ? this.sanitizeData(data) : '');
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog('ERROR')) {
      console.error(`[ERROR] ${message}`, error ? this.sanitizeData(error) : '');
    }
  }
}

export const logger = new SecureLogger();

// Legacy console.log replacement for gradual migration
export const secureLog = {
  log: (message: string, data?: any) => logger.info(message, data),
  error: (message: string, error?: any) => logger.error(message, error),
  warn: (message: string, data?: any) => logger.warn(message, data),
  debug: (message: string, data?: any) => logger.debug(message, data)
};
