import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface AuthAttempt {
  id: string;
  ip_address: string;
  email: string | null;
  attempt_type: string;
  success: boolean;
  created_at: string;
}

export function AuthenticationMonitor() {
  const [authAttempts, setAuthAttempts] = useState<AuthAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    successfulAttempts: 0,
    failedAttempts: 0,
    uniqueIPs: 0,
    suspiciousActivity: 0
  });

  useEffect(() => {
    fetchAuthAttempts();
    const interval = setInterval(fetchAuthAttempts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAuthAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('auth_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching auth attempts:', error);
        return;
      }

      // Transform data to ensure ip_address is properly typed
      const transformedData: AuthAttempt[] = (data || []).map(attempt => ({
        id: attempt.id,
        ip_address: String(attempt.ip_address || '127.0.0.1'),
        email: attempt.email,
        attempt_type: attempt.attempt_type,
        success: attempt.success,
        created_at: attempt.created_at
      }));

      setAuthAttempts(transformedData);

      // Calculate stats
      const totalAttempts = transformedData.length;
      const successfulAttempts = transformedData.filter(a => a.success).length;
      const failedAttempts = totalAttempts - successfulAttempts;
      const uniqueIPs = new Set(transformedData.map(a => a.ip_address)).size;
      
      // Suspicious activity: more than 5 failed attempts from same IP in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentFailures = transformedData.filter(a => 
        !a.success && new Date(a.created_at) > oneHourAgo
      );
      
      const failuresByIP = recentFailures.reduce((acc, attempt) => {
        acc[attempt.ip_address] = (acc[attempt.ip_address] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const suspiciousActivity = Object.values(failuresByIP).filter(count => count > 5).length;

      setStats({
        totalAttempts,
        successfulAttempts,
        failedAttempts,
        uniqueIPs,
        suspiciousActivity
      });
    } catch (err) {
      console.error('Error fetching auth attempts:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAttemptBadge = (attempt: AuthAttempt) => {
    if (attempt.success) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Sucesso
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Falha
        </Badge>
      );
    }
  };

  const getAttemptTypeIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <Shield className="w-4 h-4" />;
      case 'signup':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Carregando tentativas de autenticação...</span>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Monitor de Autenticação</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tentativas</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAttempts}</div>
              <p className="text-xs text-muted-foreground">
                Últimas 100 tentativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sucessos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.successfulAttempts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalAttempts > 0 ? Math.round((stats.successfulAttempts / stats.totalAttempts) * 100) : 0}% de sucesso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Falhas</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failedAttempts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalAttempts > 0 ? Math.round((stats.failedAttempts / stats.totalAttempts) * 100) : 0}% de falha
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">IPs Únicos</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueIPs}</div>
              <p className="text-xs text-muted-foreground">
                Endereços diferentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividade Suspeita</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.suspiciousActivity}</div>
              <p className="text-xs text-muted-foreground">
                IPs com +5 falhas/hora
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tentativas de Autenticação</CardTitle>
            <CardDescription>
              Registro de todas as tentativas de login e cadastro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {authAttempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell>
                      {format(new Date(attempt.created_at), 'dd/MM/yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {attempt.ip_address}
                    </TableCell>
                    <TableCell>
                      {attempt.email || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getAttemptTypeIcon(attempt.attempt_type)}
                        <span className="capitalize">{attempt.attempt_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getAttemptBadge(attempt)}
                    </TableCell>
                  </TableRow>
                ))}
                {authAttempts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhuma tentativa de autenticação encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
