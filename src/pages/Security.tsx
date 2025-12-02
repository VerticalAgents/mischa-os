
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SecurityDashboard } from '@/components/security/SecurityDashboard';
import { SecurityMonitor } from '@/components/security/SecurityMonitor';
import { UserManager } from '@/components/security/UserManager';
import { AdminGuard } from '@/components/auth/AdminGuard';

export default function Security() {
  return (
    <AdminGuard>
      <div className="container mx-auto py-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Painel de Segurança</TabsTrigger>
            <TabsTrigger value="users">Gerenciar Usuários</TabsTrigger>
            <TabsTrigger value="monitor">Monitor de Atividades</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
            <SecurityDashboard />
          </TabsContent>
          
          <TabsContent value="users" className="mt-6">
            <UserManager />
          </TabsContent>
          
          <TabsContent value="monitor" className="mt-6">
            <SecurityMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </AdminGuard>
  );
}
