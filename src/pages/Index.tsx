
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, Calendar, Truck, Settings, TrendingUp } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  
  const quickActions = [
    {
      title: "Dashboard Completo",
      description: "Visualize analytics e métricas detalhadas",
      icon: BarChart3,
      onClick: () => navigate('/dashboard-analytics'),
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Agendamento",
      description: "Gerencie pedidos e entregas",
      icon: Calendar,
      onClick: () => navigate('/agendamento'),
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "Clientes",
      description: "Administre sua base de clientes",
      icon: Users,
      onClick: () => navigate('/clientes'),
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "Expedição",
      description: "Controle separação e despacho",
      icon: Truck,
      onClick: () => navigate('/expedicao'),
      color: "bg-orange-500 hover:bg-orange-600"
    },
    {
      title: "Configurações",
      description: "Ajuste parâmetros do sistema",
      icon: Settings,
      onClick: () => navigate('/configuracoes'),
      color: "bg-gray-500 hover:bg-gray-600"
    },
    {
      title: "Todas as Funcionalidades",
      description: "Acesse o menu completo de opções",
      icon: TrendingUp,
      onClick: () => navigate('/home'),
      color: "bg-indigo-500 hover:bg-indigo-600"
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Bem-vindo ao MischaOS</h1>
        <p className="text-muted-foreground">
          Acesse rapidamente as principais funcionalidades do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickActions.map((action, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" onClick={action.onClick}>
            <CardHeader className="pb-4">
              <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">{action.title}</CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-start p-0 h-auto text-sm">
                Acessar →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
