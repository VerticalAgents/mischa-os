
import { useAuth } from '@/contexts/AuthContext';

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
      // Get client information
      const userAgent = navigator.userAgent;
      
      // For now, just log to console until audit_logs table is available in types
      console.log('Audit Log Entry:', {
        user_id: user.id,
        user_email: user.email,
        action: entry.action,
        table_name: entry.table_name,
        record_id: entry.record_id,
        old_values: entry.old_values,
        new_values: entry.new_values,
        user_agent: userAgent,
        timestamp: new Date().toISOString()
      });

      // TODO: Once Supabase types are updated, use this:
      // const { error } = await supabase
      //   .from('audit_logs')
      //   .insert({
      //     user_id: user.id,
      //     action: entry.action,
      //     table_name: entry.table_name,
      //     record_id: entry.record_id,
      //     old_values: entry.old_values,
      //     new_values: entry.new_values,
      //     user_agent: userAgent
      //   });

    } catch (err) {
      console.error('Error logging audit entry:', err);
    }
  };

  return { logAction };
}
