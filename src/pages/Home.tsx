
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardMetricsCard from '@/components/dashboard/DashboardMetricsCard';
import CriticalAlertsSection from '@/components/dashboard/CriticalAlertsSection';
import ManualCard from '@/components/manual/ManualCard';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useAgendamentoClienteStore } from '@/hooks/useAgendamentoClienteStore';
import { useSupabaseHistoricoProducao } from '@/hooks/useSupabaseHistoricoProducao';
import { useEffect } from 'react';
import { BarChart3, Users, Calendar, Truck, Settings, CheckCircle, Factory, Tag, PackageCheck, ShoppingBag, DollarSign, Cpu, ChevronRight, Clock, Package, UserCheck, Cog, Send } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  
  // Garantir que os agendamentos estejam carregados
  const { carregarTodosAgendamentos, agendamentos } = useAgendamentoClienteStore();
  
  // Garantir que o histórico de produção esteja carregado
  const { historico, loading: loadingHistorico, carregarHistorico } = useSupabaseHistoricoProducao();
  
  const {
    agendamentosHoje,
    separacaoPedidos,
    pedidosDespachados,
    confirmacoesPendentesSemanais,
    producaoDia
  } = useDashboardMetrics();

  useEffect(() => {
    if (agendamentos.length === 0) {
      carregarTodosAgendamentos();
    }
  }, [carregarTodosAgendamentos, agendamentos.length]);

  // Fase 1: Garantir carregamento dos dados de produção
  useEffect(() => {
    if (historico.length === 0 && !loadingHistorico) {
      console.log('Home: Forçando carregamento do histórico de produção...');
      carregarHistorico();
    }
  }, [historico.length, loadingHistorico, carregarHistorico]);

  // Log de debug para verificar estado dos dados
  useEffect(() => {
    console.log('Home - Estado dos dados:', {
      historico_length: historico.length,
      loading_historico: loadingHistorico,
      producao_dia: producaoDia,
      data_atual: new Date().toISOString()
    });
  }, [historico, loadingHistorico, producaoDia]);

  const quickActions = [
    {
      title: "Agendamento",
      description: "Gerencie pedidos e entregas",
      icon: Calendar,
      onClick: () => navigate('/agendamento'),
      color: "bg-blue-500 hover:bg-blue-600",
      badge: agendamentosHoje.previstos > 0 ? "Pendente" : undefined,
      badgeColor: "bg-amber-500"
    },
    {
      title: "Confirmação de Reposição",
      description: "Confirme reposições pendentes",
      icon: CheckCircle,
      onClick: () => navigate('/agendamento?tab=confirmacao'),
      color: "bg-green-500 hover:bg-green-600",
      badge: confirmacoesPendentesSemanais.criticos > 0 ? "Urgente" : undefined,
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
      title: "Manual de Instruções",
      description: "Guia completo do sistema",
      icon: () => <ManualCard onClick={() => navigate('/manual')} />,
      isCustomCard: true
    },
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
      <div className="text-left">
        <h1 className="text-4xl font-bold text-foreground mb-2 text-left">Bem-vindo ao MischaOS</h1>
        <p className="text-lg text-muted-foreground text-left">
          Central de comando para sua confeitaria
        </p>
      </div>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <DashboardMetricsCard
          title="Agendamentos Hoje"
          value={agendamentosHoje.total}
          subtitle={`${agendamentosHoje.agendados} agendados, ${agendamentosHoje.previstos} previstos`}
          icon={<Calendar className="h-6 w-6" />}
          severity={agendamentosHoje.previstos > 0 ? 'warning' : agendamentosHoje.total > 0 ? 'success' : 'info'}
          onClick={() => navigate('/agendamento')}
        />
        
        <DashboardMetricsCard
          title="Separação Hoje"
          value={separacaoPedidos.aguardando}
          subtitle={`${separacaoPedidos.separados} já separados`}
          icon={<Package className="h-6 w-6" />}
          severity={separacaoPedidos.aguardando > 5 ? 'warning' : 'info'}
          onClick={() => navigate('/expedicao')}
        />
        
        <DashboardMetricsCard
          title="Pedidos Despachados"
          value={pedidosDespachados.total}
          subtitle="Entregas realizadas hoje"
          icon={<Send className="h-6 w-6" />}
          severity={pedidosDespachados.total > 0 ? 'success' : 'info'}
          onClick={() => navigate('/expedicao')}
        />
        
        <DashboardMetricsCard
          title="Confirmações da Semana"
          value={confirmacoesPendentesSemanais.total}
          subtitle={confirmacoesPendentesSemanais.criticos > 0 ? `${confirmacoesPendentesSemanais.criticos} críticas (>48h)` : "Sem atrasos críticos"}
          icon={<UserCheck className="h-6 w-6" />}
          severity={confirmacoesPendentesSemanais.criticos > 0 ? 'danger' : confirmacoesPendentesSemanais.total > 0 ? 'warning' : 'success'}
          onClick={() => navigate('/agendamento?tab=confirmacao')}
        />
        
        {/* Fase 4: Card de Produção com loading state e dados corretos */}
        <DashboardMetricsCard
          title="Produção Hoje"
          value={loadingHistorico ? "..." : producaoDia.registros}
          subtitle={
            loadingHistorico 
              ? "Carregando..." 
              : producaoDia.registros > 0 
                ? `${producaoDia.totalFormas} formas, ${producaoDia.totalUnidades} unidades` 
                : "Nenhum registro hoje"
          }
          icon={<Cog className="h-6 w-6" />}
          loading={loadingHistorico}
          severity={producaoDia.pendentes > 0 ? 'warning' : producaoDia.registros > 0 ? 'success' : 'info'}
          onClick={() => navigate('/pcp?tab=historico')}
        />
      </div>

      {/* Critical Alerts */}
      <CriticalAlertsSection />

      {/* Ações Críticas */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-blue-500" />
          <h2 className="text-2xl font-semibold text-left">Ações Prioritárias</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-105 border border-border/50" onClick={action.onClick}>
              <CardHeader className="pb-3 text-left">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-md`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  {action.badge && (
                    <Badge className={`${action.badgeColor} text-white text-xs font-medium`}>
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg text-left font-semibold text-foreground">{action.title}</CardTitle>
                <CardDescription className="text-sm text-left text-muted-foreground leading-relaxed">{action.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  <span className="font-medium text-left">Acessar</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Analytics e Relatórios */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-left">
          <BarChart3 className="h-5 w-5 text-green-500" />
          Analytics e Relatórios
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analyticsActions.map((action, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-105 border border-border/50" onClick={action.onClick}>
              <CardHeader className="pb-3 text-left">
                <div className="mb-3">
                  <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-md`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-lg text-left font-semibold text-foreground">{action.title}</CardTitle>
                <CardDescription className="text-sm text-left text-muted-foreground leading-relaxed">{action.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  <span className="font-medium text-left">Acessar</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Gestão */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-left">
          <Users className="h-5 w-5 text-blue-500" />
          Gestão
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {managementActions.map((action, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-105 border border-border/50" onClick={action.onClick}>
              <CardHeader className="pb-3 text-left">
                <div className="mb-3">
                  <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-md`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-lg text-left font-semibold text-foreground">{action.title}</CardTitle>
                <CardDescription className="text-sm text-left text-muted-foreground leading-relaxed">{action.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  <span className="font-medium text-left">Acessar</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Sistema */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-left">
          <Settings className="h-5 w-5 text-gray-500" />
          Sistema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Manual Card - Custom component */}
          <ManualCard onClick={() => navigate('/manual')} />
          
          {/* Regular system action cards */}
          {systemActions.filter(action => !action.isCustomCard).map((action, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-105 border border-border/50" onClick={action.onClick}>
              <CardHeader className="pb-3 text-left">
                <div className="mb-3">
                  <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-md`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-lg text-left font-semibold text-foreground">{action.title}</CardTitle>
                <CardDescription className="text-sm text-left text-muted-foreground leading-relaxed">{action.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  <span className="font-medium text-left">Acessar</span>
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
