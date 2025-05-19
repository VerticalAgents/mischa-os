
import { useEffect } from "react";
import { ArrowUpRight, Users, ShoppingBag, Calendar, TrendingUp } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusCard from "@/components/dashboard/StatusCard";
import StatsPieChart from "@/components/dashboard/StatsPieChart";
import StatsBarChart from "@/components/dashboard/StatsBarChart";
import StatsTable from "@/components/dashboard/StatsTable";
import { useClienteStore } from "@/hooks/cliente";
import { useDashboardStore } from "@/hooks/useDashboardStore";
import { usePedidoStore } from "@/hooks/usePedidoStore";

export default function Dashboard() {
  const { clientes } = useClienteStore();
  const { pedidos } = usePedidoStore();
  const { 
    dashboardData, 
    atualizarDashboard,
    getDadosGraficoPDVsPorStatus
  } = useDashboardStore();
  
  // Atualizar dados do dashboard quando a página carregar
  useEffect(() => {
    atualizarDashboard(clientes, pedidos);
  }, [atualizarDashboard, clientes, pedidos]);
  
  const pedidosFuturos = usePedidoStore.getState().getPedidosFuturos().slice(0, 5);
  
  const giroSemanalPorPDV = dashboardData.giroMedioSemanalPorPDV
    .sort((a, b) => b.giroSemanal - a.giroSemanal)
    .slice(0, 5);
  
  return (
    <>
      <PageHeader 
        title="Dashboard" 
        description="Visão geral da operação da Mischa's Bakery"
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatusCard
          title="PDVs Ativos"
          value={dashboardData.contadoresStatus.ativos}
          icon={<Users className="h-5 w-5" />}
          description="Total de pontos de venda ativos"
        />
        
        <StatusCard
          title="Giro Médio Semanal"
          value={Math.round(dashboardData.giroMedioSemanalGeral).toLocaleString()}
          icon={<TrendingUp className="h-5 w-5" />}
          description="Brownies por semana"
          trend={{ value: 5.2, isPositive: true }}
        />
        
        <StatusCard
          title="Previsão Mensal"
          value={Math.round(dashboardData.previsaoGiroTotalMensal).toLocaleString()}
          icon={<ShoppingBag className="h-5 w-5" />}
          description="Brownies por mês"
        />
        
        <StatusCard
          title="Próximas Entregas"
          value={pedidosFuturos.length}
          icon={<Calendar className="h-5 w-5" />}
          description="Pedidos agendados"
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-5 mb-6">
        <div className="md:col-span-2">
          <StatsPieChart 
            title="Distribuição de PDVs por Status"
            description="Visão geral dos pontos de venda por status"
            data={getDadosGraficoPDVsPorStatus()}
            colors={['#4ade80', '#60a5fa', '#facc15', '#c084fc', '#f87171']}
          />
        </div>
        
        <div className="md:col-span-3">
          <StatsBarChart 
            title="Top 5 PDVs por Giro Semanal"
            description="Maiores volumes de venda por semana"
            data={giroSemanalPorPDV.map(pdv => ({
              name: pdv.nomeCliente,
              value: Math.round(pdv.giroSemanal)
            }))}
            bars={[
              { dataKey: 'value', name: 'Brownies/Semana', color: '#8b5cf6' }
            ]}
          />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <StatsTable 
          title="Top PDVs por Volume"
          description="Pontos de venda com maior giro semanal"
          data={giroSemanalPorPDV}
          columns={[
            {
              header: "Cliente",
              accessorKey: "nomeCliente"
            },
            {
              header: "Giro Semanal",
              accessorKey: (item) => Math.round(item.giroSemanal).toLocaleString(),
              cell: (item) => (
                <div className="flex items-center">
                  <span>{Math.round(item.giroSemanal).toLocaleString()}</span>
                  <ArrowUpRight className="h-4 w-4 text-green-500 ml-2" />
                </div>
              )
            }
          ]}
        />
        
        <StatsTable 
          title="Próximas Entregas"
          description="Pedidos agendados para os próximos dias"
          data={pedidosFuturos}
          columns={[
            {
              header: "Cliente",
              accessorKey: (item) => item.cliente?.nome
            },
            {
              header: "Data Prevista",
              accessorKey: (item) => new Date(item.dataPrevistaEntrega).toLocaleDateString()
            },
            {
              header: "Qtde.",
              accessorKey: "totalPedidoUnidades"
            }
          ]}
        />
      </div>
    </>
  );
}
