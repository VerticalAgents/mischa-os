
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedAuthForm } from '@/components/security/EnhancedAuthForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Eye, UserCheck } from 'lucide-react';

export default function EnhancedAuthPage() {
  const { isAuthenticated, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Security Information Panel */}
        <div className="space-y-6">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight">
              Sistema Seguro
            </h1>
            <p className="text-muted-foreground mt-2">
              Acesse sua conta com segurança máxima
            </p>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-green-500" />
                  Autenticação Segura
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription>
                  Proteção avançada contra ataques de força bruta e tentativas de acesso não autorizadas
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Lock className="h-4 w-4 text-blue-500" />
                  Senhas Fortes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription>
                  Exigimos senhas com alta complexidade: maiúsculas, minúsculas, números e caracteres especiais
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-purple-500" />
                  Monitoramento
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription>
                  Todas as atividades são registradas e monitoradas para detectar comportamentos suspeitos
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <UserCheck className="h-4 w-4 text-orange-500" />
                  Controle de Acesso
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription>
                  Sistema de roles e permissões garante que usuários acessem apenas dados autorizados
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-green-600 border-green-200">
              <Shield className="h-3 w-3 mr-1" />
              SSL/TLS
            </Badge>
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              <Lock className="h-3 w-3 mr-1" />
              Criptografia
            </Badge>
            <Badge variant="outline" className="text-purple-600 border-purple-200">
              <Eye className="h-3 w-3 mr-1" />
              Auditoria
            </Badge>
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              <UserCheck className="h-3 w-3 mr-1" />
              RLS
            </Badge>
          </div>
        </div>

        {/* Authentication Form */}
        <div className="flex items-center justify-center">
          <EnhancedAuthForm 
            mode={authMode} 
            onModeChange={setAuthMode}
          />
        </div>
      </div>
    </div>
  );
}
