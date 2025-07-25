
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { secureIPService } from '@/utils/secureIPService';

interface AuditLogEntry {
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
}

export function useAuditLog() {
  const { user } = useAuth();

  const logAction = async (entry: AuditLogEntry) => {
    if (!user) return;

    try {
      // Get client information securely
      const userAgent = navigator.userAgent;
      const ipAddress = await secureIPService.getClientIP();
      
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: entry.action,
          table_name: entry.table_name,
          record_id: entry.record_id,
          old_values: entry.old_values,
          new_values: entry.new_values,
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

  return { logAction };
}
