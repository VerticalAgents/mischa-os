
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Activity, Users, Database, Eye } from 'lucide-react';
import { AdminGuard } from '@/components/auth/AdminGuard';

interface SecurityMetrics {
  totalAuthAttempts: number;
  failedAuthAttempts: number;
  activeUsers: number;
  recentSecurityEvents: any[];
  systemAlerts: any[];
}

export function SecurityMonitor() {
  const { user } = useAuth();
  const { isAdmin } = useUserRoles();
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalAuthAttempts: 0,
    failedAuthAttempts: 0,
    activeUsers: 0,
    recentSecurityEvents: [],
    systemAlerts: []
  });
  const [loading, setLoading] = useState(true);

  const fetchSecurityMetrics = async () => {
    if (!user || !isAdmin()) return;

    try {
      setLoading(true);

      // Get authentication attempts (last 24 hours)
      const { data: authAttempts } = await supabase
        .from('auth_attempts')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      // Get recent security events
      const { data: securityEvents } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'SECURITY_EVENT')
        .limit(10)
        .order('created_at', { ascending: false });

      // Get user profiles count (approximation of active users)
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Process metrics
      const totalAttempts = authAttempts?.length || 0;
      const failedAttempts = authAttempts?.filter(attempt => !attempt.success).length || 0;

      // Create system alerts based on security events
      const alerts = [];
      
      if (failedAttempts > 10) {
        alerts.push({
          type: 'warning',
          message: `${failedAttempts} tentativas de login falharam nas últimas 24 horas`,
          timestamp: new Date()
        });
      }

      if (securityEvents && securityEvents.length > 0) {
        const criticalEvents = securityEvents.filter(event => 
          event.new_values?.severity === 'CRITICAL' || event.new_values?.severity === 'ERROR'
        );
        
        if (criticalEvents.length > 0) {
          alerts.push({
            type: 'error',
            message: `${criticalEvents.length} eventos de segurança críticos detectados`,
            timestamp: new Date()
          });
        }
      }

      setMetrics({
        totalAuthAttempts: totalAttempts,
        failedAuthAttempts: failedAttempts,
        activeUsers: userCount || 0,
        recentSecurityEvents: securityEvents || [],
        systemAlerts: alerts
      });

    } catch (error) {
      console.error('Error fetching security metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityMetrics();
    
    // Refresh metrics every 5 minutes
    const interval = setInterval(fetchSecurityMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Carregando métricas de segurança...</span>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Monitor de Segurança</h2>
        </div>

        {/* System Alerts */}
        {metrics.systemAlerts.length > 0 && (
          <div className="space-y-2">
            {metrics.systemAlerts.map((alert, index) => (
              <Alert key={index} variant={alert.type === 'error' ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Security Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tentativas de Login</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalAuthAttempts}</div>
              <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Falhas de Autenticação</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{metrics.failedAuthAttempts}</div>
              <p className="text-xs text-muted-foreground">Tentativas falharam</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeUsers}</div>
              <p className="text-xs text-muted-foreground">Total de usuários</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Security Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Eventos de Segurança Recentes
            </CardTitle>
            <CardDescription>
              Últimos 10 eventos de segurança registrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.recentSecurityEvents.length > 0 ? (
              <div className="space-y-3">
                {metrics.recentSecurityEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{event.new_values?.event_type || 'Evento de Segurança'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      event.new_values?.severity === 'CRITICAL' ? 'destructive' :
                      event.new_values?.severity === 'ERROR' ? 'destructive' :
                      event.new_values?.severity === 'WARNING' ? 'secondary' :
                      'default'
                    }>
                      {event.new_values?.severity || 'INFO'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nenhum evento de segurança registrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
