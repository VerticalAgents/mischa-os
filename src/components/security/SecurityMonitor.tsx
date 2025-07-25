
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { Shield, AlertTriangle, Eye, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { AuthenticationMonitor } from './AuthenticationMonitor';

interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export function SecurityMonitor() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
    const interval = setInterval(fetchAuditLogs, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching audit logs:', error);
        return;
      }

      // Transform the data to match our interface
      const transformedData: AuditLogEntry[] = (data || []).map(log => ({
        id: log.id,
        user_id: log.user_id,
        action: log.action,
        table_name: log.table_name,
        record_id: log.record_id,
        user_agent: log.user_agent,
        ip_address: log.ip_address as string | null,
        created_at: log.created_at,
        profiles: Array.isArray(log.profiles) 
          ? log.profiles[0] || null 
          : log.profiles || null
      }));

      setAuditLogs(transformedData);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const colors = {
      'LOGIN': 'bg-green-100 text-green-800',
      'LOGOUT': 'bg-gray-100 text-gray-800',
      'INSERT': 'bg-blue-100 text-blue-800',
      'UPDATE': 'bg-yellow-100 text-yellow-800',
      'DELETE': 'bg-red-100 text-red-800',
      'ROLE_ASSIGNED': 'bg-purple-100 text-purple-800',
      'ROLE_UPDATED': 'bg-purple-100 text-purple-800',
      'ROLE_REMOVED': 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={colors[action as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {action}
      </Badge>
    );
  };

  const getActionPriority = (action: string): 'high' | 'medium' | 'low' => {
    const highPriority = ['DELETE', 'ROLE_ASSIGNED', 'ROLE_UPDATED', 'ROLE_REMOVED'];
    const mediumPriority = ['INSERT', 'UPDATE'];
    
    if (highPriority.includes(action)) return 'high';
    if (mediumPriority.includes(action)) return 'medium';
    return 'low';
  };

  const stats = {
    totalEvents: auditLogs.length,
    criticalEvents: auditLogs.filter(log => 
      ['DELETE', 'ROLE_ASSIGNED', 'ROLE_UPDATED', 'ROLE_REMOVED'].includes(log.action)
    ).length,
    uniqueUsers: new Set(auditLogs.map(log => log.user_id)).size,
    recentActivity: auditLogs.filter(log => 
      new Date(log.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Carregando dados de segurança...</span>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Monitor de Segurança</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Recentes</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">
                Últimas 100 atividades
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Críticos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.criticalEvents}</div>
              <p className="text-xs text-muted-foreground">
                Ações sensíveis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
              <p className="text-xs text-muted-foreground">
                Usuários únicos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividade 24h</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentActivity}</div>
              <p className="text-xs text-muted-foreground">
                Eventos recentes
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="audit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="audit">Log de Auditoria</TabsTrigger>
            <TabsTrigger value="auth">Autenticação</TabsTrigger>
          </TabsList>
          
          <TabsContent value="audit" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Log de Auditoria</CardTitle>
                <CardDescription>
                  Registro completo de todas as atividades do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Tabela</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id} className={
                        getActionPriority(log.action) === 'high' ? 'bg-red-50' :
                        getActionPriority(log.action) === 'medium' ? 'bg-yellow-50' : ''
                      }>
                        <TableCell>
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {log.profiles?.full_name || 'Usuário não encontrado'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {log.profiles?.email || 'Email não disponível'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getActionBadge(log.action)}
                        </TableCell>
                        <TableCell>{log.table_name || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">{log.record_id || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">{log.ip_address || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {auditLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nenhum log de auditoria encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="auth" className="mt-6">
            <AuthenticationMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </AdminGuard>
  );
}
