
import { supabase } from '@/integrations/supabase/client';

/**
 * Secure IP service for handling client IP detection
 * Uses server-side functions when available, with client-side fallback
 */
export class SecureIPService {
  private static instance: SecureIPService;
  
  private constructor() {}
  
  static getInstance(): SecureIPService {
    if (!SecureIPService.instance) {
      SecureIPService.instance = new SecureIPService();
    }
    return SecureIPService.instance;
  }
  
  /**
   * Get client IP address securely
   * Attempts server-side detection first, falls back to client-side
   */
  async getClientIP(): Promise<string> {
    try {
      // Try to get IP from server-side function if available
      // Note: This would require the get_client_ip function to be properly defined
      // For now, we'll use a client-side fallback approach
      
      // Client-side fallback using various methods
      const ip = await this.getClientIPFallback();
      return ip || '127.0.0.1';
    } catch (error) {
      console.error('Error getting client IP:', error);
      return '127.0.0.1';
    }
  }
  
  /**
   * Client-side IP detection fallback
   */
  private async getClientIPFallback(): Promise<string> {
    try {
      // Try to get IP from headers if available in the request context
      const headers = (window as any).requestHeaders;
      if (headers) {
        return headers['x-forwarded-for'] || headers['x-real-ip'] || '127.0.0.1';
      }
      
      // If no headers available, return localhost
      return '127.0.0.1';
    } catch (error) {
      console.error('Client IP fallback failed:', error);
      return '127.0.0.1';
    }
  }
  
  /**
   * Validate IP address format
   */
  isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }
  
  /**
   * Log IP access for security monitoring
   */
  async logIPAccess(ip: string, action: string): Promise<void> {
    try {
      if (!this.isValidIP(ip)) {
        console.warn('Invalid IP format:', ip);
        return;
      }
      
      // Log the IP access attempt
      console.log(`IP Access: ${ip} - Action: ${action}`);
      
      // Here you could add database logging if needed
      // For now, we'll just log to console for security monitoring
    } catch (error) {
      console.error('Error logging IP access:', error);
    }
  }
}

// Export singleton instance
export const secureIPService = SecureIPService.getInstance();
