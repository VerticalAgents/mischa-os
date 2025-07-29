
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface SecurityEvent {
  eventType: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  details: Record<string, any>;
  userId?: string;
}

export class SecurityMonitoringService {
  private static instance: SecurityMonitoringService;
  private eventQueue: SecurityEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startEventFlush();
  }

  public static getInstance(): SecurityMonitoringService {
    if (!SecurityMonitoringService.instance) {
      SecurityMonitoringService.instance = new SecurityMonitoringService();
    }
    return SecurityMonitoringService.instance;
  }

  // Log security events
  public async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Add to queue for batch processing
      this.eventQueue.push({
        ...event,
        details: {
          ...event.details,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      });

      // For critical events, flush immediately
      if (event.severity === 'CRITICAL') {
        await this.flushEvents();
      }

      logger.info('Security event logged:', event.eventType);
    } catch (error) {
      logger.error('Failed to log security event:', error);
    }
  }

  // Monitor authentication attempts
  public async monitorAuthAttempt(
    email: string, 
    success: boolean, 
    attemptType: string = 'login'
  ): Promise<void> {
    const ipAddress = await this.getClientIP();
    
    try {
      // Log to auth_attempts table
      const { error } = await supabase
        .from('auth_attempts')
        .insert({
          email,
          success,
          attempt_type: attemptType,
          ip_address: ipAddress
        });

      if (error) {
        logger.error('Failed to log auth attempt:', error);
      }

      // Log security event for failed attempts
      if (!success) {
        await this.logSecurityEvent({
          eventType: 'FAILED_AUTH_ATTEMPT',
          severity: 'WARNING',
          details: {
            email,
            attemptType,
            ipAddress
          }
        });
      }
    } catch (error) {
      logger.error('Error monitoring auth attempt:', error);
    }
  }

  // Monitor suspicious activities
  public async monitorSuspiciousActivity(
    activityType: string,
    details: Record<string, any>,
    severity: SecurityEvent['severity'] = 'WARNING'
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: 'SUSPICIOUS_ACTIVITY',
      severity,
      details: {
        activityType,
        ...details
      }
    });
  }

  // Monitor data access patterns
  public async monitorDataAccess(
    table: string,
    operation: string,
    recordCount: number,
    userId?: string
  ): Promise<void> {
    // Flag unusual data access patterns
    if (recordCount > 1000) {
      await this.logSecurityEvent({
        eventType: 'BULK_DATA_ACCESS',
        severity: 'WARNING',
        details: {
          table,
          operation,
          recordCount
        },
        userId
      });
    }
  }

  // Monitor input validation failures
  public async monitorInputValidationFailure(
    field: string,
    value: string,
    errors: string[]
  ): Promise<void> {
    // Check for potential attack patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(value));

    if (isSuspicious) {
      await this.logSecurityEvent({
        eventType: 'MALICIOUS_INPUT_DETECTED',
        severity: 'ERROR',
        details: {
          field,
          value: value.substring(0, 100), // Truncate for security
          errors
        }
      });
    }
  }

  // Monitor rate limit violations
  public async monitorRateLimitViolation(
    action: string,
    ipAddress: string,
    userId?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: 'RATE_LIMIT_VIOLATION',
      severity: 'WARNING',
      details: {
        action,
        ipAddress
      },
      userId
    });
  }

  // Monitor privilege escalation attempts
  public async monitorPrivilegeEscalation(
    attemptedAction: string,
    userId: string,
    currentRole: string
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: 'PRIVILEGE_ESCALATION_ATTEMPT',
      severity: 'CRITICAL',
      details: {
        attemptedAction,
        currentRole
      },
      userId
    });
  }

  // Get real-time security alerts
  public async getSecurityAlerts(
    severity: SecurityEvent['severity'] = 'WARNING',
    limit: number = 50
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'SECURITY_EVENT')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Failed to fetch security alerts:', error);
        return [];
      }

      return data?.filter((log: any) => {
        const newValues = log.new_values || {};
        return newValues.severity === severity || 
               (severity === 'WARNING' && ['ERROR', 'CRITICAL'].includes(newValues.severity));
      }) || [];
    } catch (error) {
      logger.error('Error fetching security alerts:', error);
      return [];
    }
  }

  // Private methods
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || '127.0.0.1';
    } catch {
      return '127.0.0.1';
    }
  }

  private startEventFlush(): void {
    this.flushInterval = setInterval(async () => {
      if (this.eventQueue.length > 0) {
        await this.flushEvents();
      }
    }, 5000); // Flush every 5 seconds
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Log security events using the audit_logs table directly
      for (const event of events) {
        await supabase
          .from('audit_logs')
          .insert({
            action: 'SECURITY_EVENT',
            table_name: 'security_events',
            new_values: {
              event_type: event.eventType,
              severity: event.severity,
              details: event.details,
              user_id: event.userId
            }
          });
      }
    } catch (error) {
      logger.error('Failed to flush security events:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...events);
    }
  }

  // Cleanup
  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
}

// Export singleton instance
export const securityMonitoring = SecurityMonitoringService.getInstance();
