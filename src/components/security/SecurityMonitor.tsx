
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Shield, Eye, Activity, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

type AuditLog = {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values: any;
  new_values: any;
  created_at: string;
  user_agent: string;
  ip_address: unknown;
};

type AuthAttempt = {
  id: string;
  ip_address: string;
  email: string;
  attempt_type: string;
  success: boolean;
  created_at: string;
};

export function SecurityMonitor() {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');

  const { data: auditLogs, isLoading: auditLoading, refetch: refetchAudit } = useQuery({
    queryKey: ['audit-logs', timeRange],
    queryFn: async () => {
      const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as AuditLog[];
    },
  });

  const { data: authAttempts, isLoading: authLoading, refetch: refetchAuth } = useQuery({
    queryKey: ['auth-attempts', timeRange],
    queryFn: async () => {
      const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const { data, error } = await supabase
        .from('auth_attempts')
        .select('*')
        .gte('created_at', new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as AuthAttempt[];
    },
  });

  const handleRefresh = () => {
    refetchAudit();
    refetchAuth();
  };

  // Filter security events from audit logs
  const securityEvents = auditLogs?.filter((log: AuditLog) => {
    // Check if it's a security event
    if (log.action !== 'SECURITY_EVENT') return false;
    
    // Apply severity filter
    if (severityFilter !== 'all') {
      const newValues = log.new_values as any;
      const severity = newValues?.severity;
      if (severity !== severityFilter) return false;
    }
    
    return true;
  }) || [];

  const failedAttempts = authAttempts?.filter(attempt => !attempt.success) || [];
  const suspiciousIPs = [...new Set(failedAttempts.map(attempt => attempt.ip_address))];

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'error': return 'bg-red-50 text-red-700 border-red-100';
      case 'warning': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      default: return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Monitor de Segurança</h1>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-green-500" />
              Eventos Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityEvents.length}</div>
            <p className="text-xs text-muted-foreground">Últimas {timeRange}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Tentativas Falhas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedAttempts.length}</div>
            <p className="text-xs text-muted-foreground">Falhas de login</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4 text-blue-500" />
              IPs Suspeitos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suspiciousIPs.length}</div>
            <p className="text-xs text-muted-foreground">IPs únicos com falhas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-purple-500" />
              Atividade Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(auditLogs?.length || 0) + (authAttempts?.length || 0)}</div>
            <p className="text-xs text-muted-foreground">Logs de auditoria</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por severidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as severidades</SelectItem>
            <SelectItem value="INFO">Info</SelectItem>
            <SelectItem value="WARNING">Aviso</SelectItem>
            <SelectItem value="ERROR">Erro</SelectItem>
            <SelectItem value="CRITICAL">Crítico</SelectItem>
          </SelectContent>
        </Select>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Últimas 24h</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos de Segurança</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : securityEvents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum evento de segurança encontrado
            </p>
          ) : (
            <div className="space-y-3">
              {securityEvents.map((event) => {
                const newValues = event.new_values as any;
                const severity = newValues?.severity || 'INFO';
                const eventType = newValues?.event_type || 'UNKNOWN';
                const details = newValues?.details || {};

                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={getSeverityColor(severity)}>
                        {severity}
                      </Badge>
                      <div>
                        <p className="font-medium">{eventType}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.created_at), 'dd/MM/yyyy HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Usuário: {event.user_id}</p>
                      {details.email && (
                        <p className="text-sm text-muted-foreground">
                          {details.email}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Failed Login Attempts */}
      <Card>
        <CardHeader>
          <CardTitle>Tentativas de Login Falhadas</CardTitle>
        </CardHeader>
        <CardContent>
          {authLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : failedAttempts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma tentativa de login falhada encontrada
            </p>
          ) : (
            <div className="space-y-3">
              {failedAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{attempt.email}</p>
                    <p className="text-sm text-muted-foreground">
                      IP: {attempt.ip_address} • {format(new Date(attempt.created_at), 'dd/MM/yyyy HH:mm:ss')}
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {attempt.attempt_type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
