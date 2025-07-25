
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AuditLogEntry {
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
}

// Helper function to get client IP
const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
};

export function useAuditLog() {
  const { user } = useAuth();

  const logAction = async (entry: AuditLogEntry) => {
    if (!user) return;

    try {
      // Get client information
      const userAgent = navigator.userAgent;
      const ipAddress = await getClientIP();
      
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
