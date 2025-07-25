
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
      // Use server-side function instead of external API
      const { data, error } = await supabase.rpc('get_client_ip');
      
      if (error) {
        console.error('Failed to get client IP:', error);
        return '127.0.0.1';
      }

      this.cachedIP = data || '127.0.0.1';
      this.cacheTimestamp = Date.now();
      
      return this.cachedIP;
    } catch (error) {
      console.error('Error getting client IP:', error);
      return '127.0.0.1';
    }
  }

  static clearCache(): void {
    this.cachedIP = null;
    this.cacheTimestamp = 0;
  }
}
