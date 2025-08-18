
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardMetricsCard from '@/components/dashboard/DashboardMetricsCard';
import CriticalAlertsSection from '@/components/dashboard/CriticalAlertsSection';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  Truck, 
  Settings, 
  CheckCircle, 
  Factory, 
  Tag, 
  PackageCheck, 
  ShoppingBag, 
  DollarSign, 
  Cpu, 
  ChevronRight,
  Clock,
  Package,
  UserCheck,
  Cog
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { 
    agendamentosCriticos, 
    separacaoPedidos, 
    confirmacoesPendentes, 
    producaoDia 
  } = useDashboardMetrics();

  const quickActions = [
    {
      title: "Agendamento",
      description: "Gerencie pedidos e entregas",
      icon: Calendar,
      onClick: () => navigate('/agendamento'),
      color: "bg-blue-500 hover:bg-blue-600",
      badge: agendamentosCriticos.atrasados > 0 ? "Crítico" : undefined,
      badgeColor: "bg-red-500"
    },
    {
      title: "Confirmação de Reposição",
      description: "Confirme reposições pendentes",
      icon: CheckCircle,
      onClick: () => navigate('/agendamento?tab=confirmacao'),
      color: "bg-green-500 hover:bg-green-600",
      badge: confirmacoesPendentes.criticos > 0 ? "Urgente" : undefined,
      badgeColor: "bg-orange-500"
    },
    {
      title: "PCP",
      description: "Planejamento e controle da produção",
      icon: Factory,
      onClick: () => navigate('/pcp'),
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "Expedição",
      description: "Controle separação e despacho",
      icon: Truck,
      onClick: () => navigate('/expedicao'),
      color: "bg-orange-500 hover:bg-orange-600",
      badge: separacaoPedidos.aguardando > 0 ? `${separacaoPedidos.aguardando}` : undefined,
      badgeColor: "bg-blue-500"
    }
  ];

  const analyticsActions = [
    {
      title: "Dashboard Completo",
      description: "Visualize analytics e métricas detalhadas",
      icon: BarChart3,
      onClick: () => navigate('/dashboard-analytics'),
      color: "bg-indigo-500 hover:bg-indigo-600"
    },
    {
      title: "Gestão Financeira",
      description: "Controle financeiro e projeções",
      icon: DollarSign,
      onClick: () => navigate('/gestao-financeira'),
      color: "bg-emerald-500 hover:bg-emerald-600"
    }
  ];

  const managementActions = [
    {
      title: "Clientes",
      description: "Administre sua base de clientes",
      icon: Users,
      onClick: () => navigate('/clientes'),
      color: "bg-cyan-500 hover:bg-cyan-600"
    },
    {
      title: "Precificação",
      description: "Gerencie produtos e preços",
      icon: Tag,
      onClick: () => navigate('/precificacao'),
      color: "bg-pink-500 hover:bg-pink-600"
    },
    {
      title: "Estoque",
      description: "Controle de insumos e produtos",
      icon: PackageCheck,
      onClick: () => navigate('/estoque/insumos'),
      color: "bg-amber-500 hover:bg-amber-600"
    },
    {
      title: "Gestão Comercial",
      description: "Funil de leads e parceiros",
      icon: ShoppingBag,
      onClick: () => navigate('/gestao-comercial'),
      color: "bg-violet-500 hover:bg-violet-600"
    }
  ];

  const systemActions = [
    {
      title: "Agentes de IA",
      description: "Assistentes inteligentes",
      icon: Cpu,
      onClick: () => navigate('/agentes-ia'),
      color: "bg-slate-500 hover:bg-slate-600"
    },
    {
      title: "Configurações",
      description: "Ajuste parâmetros do sistema",
      icon: Settings,
      onClick: () => navigate('/configuracoes'),
      color: "bg-gray-500 hover:bg-gray-600"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Bem-vindo ao MischaOS</h1>
        <p className="text-lg text-muted-foreground">
          Central de comando para sua confeitaria
        </p>
      </div>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardMetricsCard
          title="Agendamentos Hoje"
          value={agendamentosCriticos.total}
          subtitle={agendamentosCriticos.atrasados > 0 ? `${agendamentosCriticos.atrasados} em atraso` : "Tudo em dia"}
          icon={<Calendar className="h-6 w-6" />}
          severity={agendamentosCriticos.atrasados > 0 ? 'danger' : 'success'}
          onClick={() => navigate('/agendamento')}
        />
        
        <DashboardMetricsCard
          title="Separação de Pedidos"
          value={separacaoPedidos.aguardando}
          subtitle={`${separacaoPedidos.separados} já separados`}
          icon={<Package className="h-6 w-6" />}
          severity={separacaoPedidos.aguardando > 5 ? 'warning' : 'info'}
          onClick={() => navigate('/expedicao')}
        />
        
        <DashboardMetricsCard
          title="Confirmações Pendentes"
          value={confirmacoesPendentes.total}
          subtitle={confirmacoesPendentes.criticos > 0 ? `${confirmacoesPendentes.criticos} críticas (>48h)` : "Sem atrasos"}
          icon={<UserCheck className="h-6 w-6" />}
          severity={confirmacoesPendentes.criticos > 0 ? 'danger' : confirmacoesPendentes.total > 0 ? 'warning' : 'success'}
          onClick={() => navigate('/agendamento?tab=confirmacao')}
        />
        
        <DashboardMetricsCard
          title="Produção Hoje"
          value={producaoDia.totalUnidades}
          subtitle={`${producaoDia.confirmados} confirmados, ${producaoDia.pendentes} pendentes`}
          icon={<Cog className="h-6 w-6" />}
          severity={producaoDia.pendentes > 0 ? 'warning' : 'success'}
          onClick={() => navigate('/pcp')}
        />
      </div>

      {/* Critical Alerts */}
      <CriticalAlertsSection />

      {/* Ações Críticas */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-blue-500" />
          <h2 className="text-2xl font-semibold">Ações Prioritárias</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer group" 
              onClick={action.onClick}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  {action.badge && (
                    <Badge className={`${action.badgeColor} text-white text-xs`}>
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription className="text-sm">{action.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  <span>Acessar</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Analytics e Relatórios */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-green-500" />
          Analytics e Relatórios
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analyticsActions.map((action, index) => (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer group" 
              onClick={action.onClick}
            >
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription className="text-sm">{action.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  <span>Acessar</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Gestão */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          Gestão
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {managementActions.map((action, index) => (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer group" 
              onClick={action.onClick}
            >
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription className="text-sm">{action.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  <span>Acessar</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Sistema */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-500" />
          Sistema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemActions.map((action, index) => (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer group" 
              onClick={action.onClick}
            >
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription className="text-sm">{action.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  <span>Acessar</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
