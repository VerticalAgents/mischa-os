
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { securityMonitoring } from '@/services/securityMonitoring';
import { Shield, AlertTriangle, Activity, RefreshCw, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface SecurityAlert {
  id: string;
  event_type: string;
  severity: string;
  details: any;
  created_at: string;
  user_id?: string;
}

export function SecurityDashboard() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<'WARNING' | 'ERROR' | 'CRITICAL'>('WARNING');

  useEffect(() => {
    fetchSecurityAlerts();
    const interval = setInterval(fetchSecurityAlerts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedSeverity]);

  const fetchSecurityAlerts = async () => {
    try {
      setLoading(true);
      const alertsData = await securityMonitoring.getSecurityAlerts(selectedSeverity);
      setAlerts(alertsData.map(log => ({
        id: log.id,
        event_type: log.new_values?.event_type || 'UNKNOWN',
        severity: log.new_values?.severity || 'INFO',
        details: log.new_values?.details || {},
        created_at: log.created_at,
        user_id: log.user_id
      })));
    } catch (error) {
      console.error('Error fetching security alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ERROR':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'WARNING':
        return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'FAILED_AUTH_ATTEMPT':
        return <Shield className="h-4 w-4" />;
      case 'SUSPICIOUS_ACTIVITY':
        return <AlertTriangle className="h-4 w-4" />;
      case 'MALICIOUS_INPUT_DETECTED':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'PRIVILEGE_ESCALATION_ATTEMPT':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatEventDetails = (details: any) => {
    if (!details || Object.keys(details).length === 0) return 'Nenhum detalhe disponível';

    return Object.entries(details)
      .filter(([key]) => !['timestamp', 'userAgent', 'url'].includes(key))
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Dashboard de Segurança</h1>
          </div>
          <Button onClick={fetchSecurityAlerts} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Severity Filter */}
        <div className="flex gap-2">
          {['WARNING', 'ERROR', 'CRITICAL'].map(severity => (
            <Button
              key={severity}
              variant={selectedSeverity === severity ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity(severity as any)}
            >
              {severity}
            </Button>
          ))}
        </div>

        {/* Security Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Segurança - {selectedSeverity}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum alerta de segurança encontrado</p>
                <p className="text-sm">Sistema funcionando normalmente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getEventIcon(alert.event_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-medium">{alert.event_type.replace(/_/g, ' ')}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatEventDetails(alert.details)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm:ss')}
                            {alert.user_id && ` • Usuário: ${alert.user_id.substring(0, 8)}...`}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recomendações de Segurança</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Monitoramento Ativo</h4>
                  <p className="text-sm text-blue-700">
                    O sistema está monitorando ativamente tentativas de login, atividades suspeitas e validação de entrada.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Proteção CSRF Ativa</h4>
                  <p className="text-sm text-green-700">
                    Proteção contra ataques CSRF está ativa em todos os formulários críticos.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Validação de Entrada Rigorosa</h4>
                  <p className="text-sm text-yellow-700">
                    Todas as entradas de usuário passam por validação e sanitização para prevenir ataques XSS e SQL injection.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
