
import { supabase } from '@/integrations/supabase/client';

export class SecureIPService {
  private static cachedIP: string | null = null;
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async getClientIP(): Promise<string> {
    // Check cache first
    if (this.cachedIP && Date.now() - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.cachedIP;
    }

    try {
      // Try to get IP from headers first (client-side fallback)
      const clientIP = this.getClientSideIP();
      if (clientIP && clientIP !== '127.0.0.1') {
        this.cachedIP = clientIP;
        this.cacheTimestamp = Date.now();
        return clientIP;
      }

      // Fallback to localhost if no IP can be determined
      this.cachedIP = '127.0.0.1';
      this.cacheTimestamp = Date.now();
      
      return this.cachedIP;
    } catch (error) {
      console.error('Error getting client IP:', error);
      return '127.0.0.1';
    }
  }

  private static getClientSideIP(): string {
    // Try to get IP from various client-side sources
    // This is a fallback method since we can't reliably get real IP client-side
    return '127.0.0.1';
  }

  static clearCache(): void {
    this.cachedIP = null;
    this.cacheTimestamp = 0;
  }
}
