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

  // Funções auxiliares para pluralização
  const pluralize = (count: number, singular: string, plural: string) => {
    return count === 1 ? singular : plural;
  };

  // Formatação das legendas dos cards
  const getAgendamentosLegenda = () => {
    const { agendados, previstos } = agendamentosHoje;
    return `${agendados} ${pluralize(agendados, 'agendado', 'agendados')}, ${previstos} ${pluralize(previstos, 'previsto', 'previstos')}`;
  };

  const getSeparacaoLegenda = () => {
    const { separados } = separacaoPedidos;
    return `${separados} já ${pluralize(separados, 'separado', 'separados')}`;
  };

  const getConfirmacoesLegenda = () => {
    const { criticos } = confirmacoesPendentesSemanais;
    return criticos > 0 
      ? `${criticos} ${pluralize(criticos, 'atraso crítico', 'atrasos críticos')}`
      : 'Sem atrasos críticos';
  };

  const getProducaoLegenda = () => {
    const { totalFormas, totalUnidades } = producaoDia;
    return `${totalFormas} ${pluralize(totalFormas, 'forma', 'formas')}, ${totalUnidades} ${pluralize(totalUnidades, 'unidade', 'unidades')}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-4xl font-bold text-foreground mb-2">Bem-vindo ao MischaOS</h1>
        <p className="text-lg text-muted-foreground">
          Central de comando para sua confeitaria
        </p>
      </div>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <DashboardMetricsCard
          title="Agendamentos • Hoje"
          value={agendamentosHoje.total}
          subtitle={getAgendamentosLegenda()}
          icon={<Calendar className="h-5 w-5" />}
          severity={agendamentosHoje.previstos > 0 ? 'warning' : agendamentosHoje.total > 0 ? 'success' : 'info'}
          onClick={() => navigate('/agendamento')}
        />
        
        <DashboardMetricsCard
          title="Separação • Hoje"
          value={separacaoPedidos.separados}
          subtitle={getSeparacaoLegenda()}
          icon={<Package className="h-5 w-5" />}
          severity={separacaoPedidos.aguardando > 5 ? 'warning' : 'info'}
          onClick={() => navigate('/expedicao')}
        />
        
        <DashboardMetricsCard
          title="Pedidos • Despachados"
          value={pedidosDespachados.total}
          subtitle="Entregas realizadas hoje"
          icon={<Send className="h-5 w-5" />}
          severity={pedidosDespachados.total > 0 ? 'success' : 'info'}
          onClick={() => navigate('/expedicao')}
        />
        
        <DashboardMetricsCard
          title="Confirmações • da Semana"
          value={confirmacoesPendentesSemanais.total}
          subtitle={getConfirmacoesLegenda()}
          icon={<UserCheck className="h-5 w-5" />}
          severity={confirmacoesPendentesSemanais.criticos > 0 ? 'danger' : confirmacoesPendentesSemanais.total > 0 ? 'warning' : 'success'}
          onClick={() => navigate('/agendamento?tab=confirmacao')}
        />
        
        <DashboardMetricsCard
          title="Produção • Hoje"
          value={loadingHistorico ? "..." : producaoDia.registros}
          subtitle={
            loadingHistorico 
              ? "Carregando..." 
              : producaoDia.registros > 0 
                ? getProducaoLegenda()
                : "Nenhum registro hoje"
          }
          icon={<Cog className="h-5 w-5" />}
          loading={loadingHistorico}
          severity={producaoDia.pendentes > 0 ? 'warning' : producaoDia.registros > 0 ? 'success' : 'info'}
          onClick={() => navigate('/pcp?tab=historico')}
        />
      </div>

      {/* Critical Alerts */}
      <CriticalAlertsSection />

      {/* Ações Críticas */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-5 w-5 text-blue-500" />
          <h2 className="text-2xl font-semibold">Ações Prioritárias</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Card 
              key={index} 
              className="group cursor-pointer border border-border/60 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-black/5 hover:border-border/80 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1" 
              onClick={action.onClick}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg shadow-black/10`}>
                    <action.icon className="h-7 w-7 text-white" />
                  </div>
                  {action.badge && (
                    <Badge className={`${action.badgeColor} text-white text-xs font-medium px-2 py-1 shadow-sm`}>
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <div className="text-left space-y-2">
                  <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {action.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed font-medium">
                    {action.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm group-hover:text-primary transition-colors">
                  <span className="font-semibold text-left">Acessar</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Analytics e Relatórios */}
      <div>
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-green-500" />
          Analytics e Relatórios
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analyticsActions.map((action, index) => (
            <Card 
              key={index} 
              className="group cursor-pointer border border-border/60 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-black/5 hover:border-border/80 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1" 
              onClick={action.onClick}
            >
              <CardHeader className="pb-4">
                <div className="mb-4">
                  <div className={`w-14 h-14 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg shadow-black/10`}>
                    <action.icon className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="text-left space-y-2">
                  <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {action.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed font-medium">
                    {action.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm group-hover:text-primary transition-colors">
                  <span className="font-semibold text-left">Acessar</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Gestão */}
      <div>
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          Gestão
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {managementActions.map((action, index) => (
            <Card 
              key={index} 
              className="group cursor-pointer border border-border/60 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-black/5 hover:border-border/80 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1" 
              onClick={action.onClick}
            >
              <CardHeader className="pb-4">
                <div className="mb-4">
                  <div className={`w-14 h-14 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg shadow-black/10`}>
                    <action.icon className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="text-left space-y-2">
                  <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {action.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed font-medium">
                    {action.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm group-hover:text-primary transition-colors">
                  <span className="font-semibold text-left">Acessar</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Sistema */}
      <div>
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-500" />
          Sistema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Manual Card - Custom component */}
          <ManualCard onClick={() => navigate('/manual')} />
          
          {/* Regular system action cards */}
          {systemActions.filter(action => !action.isCustomCard).map((action, index) => (
            <Card 
              key={index} 
              className="group cursor-pointer border border-border/60 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-black/5 hover:border-border/80 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1" 
              onClick={action.onClick}
            >
              <CardHeader className="pb-4">
                <div className="mb-4">
                  <div className={`w-14 h-14 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg shadow-black/10`}>
                    <action.icon className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="text-left space-y-2">
                  <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {action.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed font-medium">
                    {action.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm group-hover:text-primary transition-colors">
                  <span className="font-semibold text-left">Acessar</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
