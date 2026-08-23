import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ManualCard from '@/components/manual/ManualCard';
import CartaoAcao from '@/components/common/CartaoAcao';
import { useClienteStore } from '@/hooks/useClienteStore';
import { useAgendamentoClienteStore } from '@/hooks/useAgendamentoClienteStore';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { Calendar, Truck, Settings, CheckCircle, Factory, Cpu } from 'lucide-react';

/**
 * Rotulo de secao: maiuscula espacada, como todo rotulo de interface nesta casa
 * (secao 4 do DESIGN.md). Antes era um h2 de 20px com icone colorido ao lado —
 * competia com o titulo da pagina e com os proprios cartoes.
 */
const TituloSecao = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[1.5px] text-muted-foreground">
    {children}
  </h2>
);

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
      badge: agendamentosHoje.previstos > 0 ? "Pendente" : undefined,
      tom: "alerta" as const
    },
    {
      title: "Confirmação",
      description: "Confirme reposições pendentes",
      icon: CheckCircle,
      onClick: () => navigate('/agendamento?tab=confirmacao'),
      badge: confirmacoesPendentesSemanais.criticos > 0 ? "Urgente" : undefined,
      tom: "alerta" as const
    },
    {
      title: "PCP",
      description: "Planejamento de produção",
      icon: Factory,
      onClick: () => navigate('/pcp')
    },
    {
      title: "Expedição",
      description: "Separação e despacho",
      icon: Truck,
      onClick: () => navigate('/expedicao'),
      badge: separacaoPedidos.aguardando > 0 ? `${separacaoPedidos.aguardando}` : undefined,
      tom: "marca" as const
    }
  ];

  const systemActions = [
    {
      title: "Agentes de IA",
      description: "Assistentes inteligentes",
      icon: Cpu,
      onClick: () => navigate('/agentes-ia')
    },
    {
      title: "Configurações",
      description: "Parâmetros do sistema",
      icon: Settings,
      onClick: () => navigate('/configuracoes')
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Bem-vindo ao MischaOS
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Panorama geral do seu negócio</p>
      </div>

      {/* Seção 1: Indicadores Principais */}
      <HomeIndicadoresClientes />

      {/* Seção 2: Gráficos - Giro e Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HomeGiroSemanalChart />
        <HomeStatusPieChart />
      </div>

      {/* Seção 3: Produção */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HomeProducaoSemana />
        <HomeSugestaoProducao />
      </div>

      {/* Seção 4: Funil de Leads */}
      <HomeFunilLeadsResumo />

      {/* Seção 5: Ações Rápidas */}
      <div>
        <TituloSecao>Ações rápidas</TituloSecao>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <CartaoAcao
              key={action.title}
              titulo={action.title}
              descricao={action.description}
              Icone={action.icon}
              aoClicar={action.onClick}
              distintivo={action.badge}
              tomDistintivo={action.tom}
            />
          ))}
        </div>
      </div>

      {/* Seção 6: Sistema */}
      <div>
        <TituloSecao>Sistema</TituloSecao>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ManualCard onClick={() => navigate('/manual')} />
          {systemActions.map((action) => (
            <CartaoAcao
              key={action.title}
              titulo={action.title}
              descricao={action.description}
              Icone={action.icon}
              aoClicar={action.onClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
