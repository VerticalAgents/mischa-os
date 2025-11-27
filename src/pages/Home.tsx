import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ManualCard from '@/components/manual/ManualCard';
import { useClienteStore } from '@/hooks/useClienteStore';
import { useAgendamentoClienteStore } from '@/hooks/useAgendamentoClienteStore';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { 
  Calendar, Truck, Settings, CheckCircle, Factory, 
  ChevronRight, Clock, Cpu 
} from 'lucide-react';

// Novos componentes do dashboard executivo
import {
  HomeIndicadoresClientes,
  HomeGiroSemanalChart,
  HomeStatusPieChart,
  HomeProducaoSemana,
  HomeSugestaoProducao,
  HomeFunilLeadsResumo
} from '@/components/home';

export default function Home() {
  const navigate = useNavigate();
  
  // Carregar dados necessários
  const { carregarClientes, clientes } = useClienteStore();
  const { carregarTodosAgendamentos, agendamentos } = useAgendamentoClienteStore();
  
  const {
    agendamentosHoje,
    separacaoPedidos,
    confirmacoesPendentesSemanais
  } = useDashboardMetrics();

  useEffect(() => {
    if (clientes.length === 0) {
      carregarClientes();
    }
  }, [carregarClientes, clientes.length]);

  useEffect(() => {
    if (agendamentos.length === 0) {
      carregarTodosAgendamentos();
    }
  }, [carregarTodosAgendamentos, agendamentos.length]);

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
      title: "Confirmação",
      description: "Confirme reposições pendentes",
      icon: CheckCircle,
      onClick: () => navigate('/agendamento?tab=confirmacao'),
      color: "bg-green-500 hover:bg-green-600",
      badge: confirmacoesPendentesSemanais.criticos > 0 ? "Urgente" : undefined,
      badgeColor: "bg-orange-500"
    },
    {
      title: "PCP",
      description: "Planejamento de produção",
      icon: Factory,
      onClick: () => navigate('/pcp'),
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "Expedição",
      description: "Separação e despacho",
      icon: Truck,
      onClick: () => navigate('/expedicao'),
      color: "bg-orange-500 hover:bg-orange-600",
      badge: separacaoPedidos.aguardando > 0 ? `${separacaoPedidos.aguardando}` : undefined,
      badgeColor: "bg-blue-500"
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
      description: "Parâmetros do sistema",
      icon: Settings,
      onClick: () => navigate('/configuracoes'),
      color: "bg-gray-500 hover:bg-gray-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-3xl font-bold text-foreground mb-1">Bem-vindo ao MischaOS</h1>
        <p className="text-muted-foreground">
          Panorama geral do seu negócio
        </p>
      </div>

      {/* Seção 1: Indicadores Principais */}
      <HomeIndicadoresClientes />

      {/* Seção 2: Gráficos - Giro e Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HomeGiroSemanalChart />
        <HomeStatusPieChart />
      </div>

      {/* Seção 3: Produção */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HomeProducaoSemana />
        <HomeSugestaoProducao />
      </div>

      {/* Seção 4: Funil de Leads */}
      <HomeFunilLeadsResumo />

      {/* Seção 5: Ações Rápidas */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Ações Rápidas</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card 
              key={index} 
              className="group cursor-pointer border border-border/60 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-border/80 transition-all duration-300 hover:scale-[1.02]" 
              onClick={action.onClick}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-md`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  {action.badge && (
                    <Badge className={`${action.badgeColor} text-white text-[10px] px-1.5 py-0.5`}>
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors text-left">
                  {action.title}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground text-left">
                  {action.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  <span className="font-medium">Acessar</span>
                  <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Seção 6: Sistema */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Sistema</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ManualCard onClick={() => navigate('/manual')} />
          
          {systemActions.map((action, index) => (
            <Card 
              key={index} 
              className="group cursor-pointer border border-border/60 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-border/80 transition-all duration-300 hover:scale-[1.02]" 
              onClick={action.onClick}
            >
              <CardHeader className="p-4 pb-2">
                <div className="mb-2">
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-md`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <CardTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors text-left">
                  {action.title}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground text-left">
                  {action.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  <span className="font-medium">Acessar</span>
                  <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
