
import { logger } from '@/utils/logger';

export interface CSRFToken {
  token: string;
  timestamp: number;
  expires: number;
}

export class CSRFProtection {
  private static readonly TOKEN_KEY = 'csrf_token';
  private static readonly TOKEN_LIFETIME = 60 * 60 * 1000; // 1 hour

  // Generate a new CSRF token
  public static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    const csrfToken: CSRFToken = {
      token,
      timestamp: Date.now(),
      expires: Date.now() + this.TOKEN_LIFETIME
    };

    try {
      localStorage.setItem(this.TOKEN_KEY, JSON.stringify(csrfToken));
      logger.debug('CSRF token generated');
      return token;
    } catch (error) {
      logger.error('Failed to store CSRF token:', error);
      return token;
    }
  }

  // Get current CSRF token
  public static getToken(): string | null {
    try {
      const stored = localStorage.getItem(this.TOKEN_KEY);
      if (!stored) return null;

      const csrfToken: CSRFToken = JSON.parse(stored);
      
      // Check if token is expired
      if (Date.now() > csrfToken.expires) {
        this.removeToken();
        return null;
      }

      return csrfToken.token;
    } catch (error) {
      logger.error('Failed to get CSRF token:', error);
      return null;
    }
  }

  // Validate CSRF token
  public static validateToken(providedToken: string): boolean {
    const storedToken = this.getToken();
    
    if (!storedToken || !providedToken) {
      logger.warn('CSRF validation failed: missing token');
      return false;
    }

    const isValid = storedToken === providedToken;
    
    if (!isValid) {
      logger.warn('CSRF validation failed: token mismatch');
    }

    return isValid;
  }

  // Remove CSRF token
  public static removeToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      logger.error('Failed to remove CSRF token:', error);
    }
  }

  // Get token for form submissions
  public static getTokenForForm(): string {
    const token = this.getToken();
    return token || this.generateToken();
  }

  // Middleware for form submissions
  public static async protectFormSubmission<T>(
    formData: T,
    csrfToken: string,
    submitFn: (data: T) => Promise<any>
  ): Promise<any> {
    if (!this.validateToken(csrfToken)) {
      throw new Error('Requisição inválida. Recarregue a página e tente novamente.');
    }

    try {
      return await submitFn(formData);
    } catch (error) {
      logger.error('Form submission failed:', error);
      throw error;
    }
  }

  // Auto-refresh token before expiration
  public static startTokenRefresh(): void {
    setInterval(() => {
      const stored = localStorage.getItem(this.TOKEN_KEY);
      if (!stored) return;

      try {
        const csrfToken: CSRFToken = JSON.parse(stored);
        const timeUntilExpiry = csrfToken.expires - Date.now();
        
        // Refresh token when 10 minutes remaining
        if (timeUntilExpiry < 10 * 60 * 1000 && timeUntilExpiry > 0) {
          this.generateToken();
          logger.debug('CSRF token auto-refreshed');
        }
      } catch (error) {
        logger.error('Failed to auto-refresh CSRF token:', error);
      }
    }, 60 * 1000); // Check every minute
  }
}

// Initialize token refresh on module load
if (typeof window !== 'undefined') {
  CSRFProtection.startTokenRefresh();
}
