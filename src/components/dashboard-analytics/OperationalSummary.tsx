
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Users, TrendingUp, ShoppingBag, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusCard from "@/components/dashboard/StatusCard";
import StatsPieChart from "@/components/dashboard/StatsPieChart";
import StatsBarChart from "@/components/dashboard/StatsBarChart";
import StatsTable from "@/components/dashboard/StatsTable";
import { Cliente, DashboardData } from "@/types";
import { DREData } from "@/types/projections";
import { usePedidoStore } from "@/hooks/usePedidoStore";

interface OperationalSummaryProps {
  dashboardData: DashboardData;
  baseDRE: DREData | null;
  clientes: Cliente[];
}

export default function OperationalSummary({ 
  dashboardData, 
  baseDRE,
  clientes 
}: OperationalSummaryProps) {
  const [faturamentoMensal, setFaturamentoMensal] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(0);
  
  // Calcular ticket médio e faturamento
  useEffect(() => {
    if (baseDRE && dashboardData.contadoresStatus.ativos > 0) {
      const faturamento = baseDRE.totalRevenue;
      setFaturamentoMensal(faturamento);
      setTicketMedio(faturamento / dashboardData.contadoresStatus.ativos);
    }
  }, [baseDRE, dashboardData]);
  
  // Calcular % produção realizada (dummy data para exemplo - deve ser integrado com PCP)
  const producaoPlanejada = 1000;
  const producaoRealizada = 850;
  const percentualProducao = (producaoRealizada / producaoPlanejada) * 100;
  
  const pedidosFuturos = usePedidoStore.getState().getPedidosFuturos().slice(0, 5);
  
  const giroSemanalPorPDV = dashboardData.giroMedioSemanalPorPDV
    .sort((a, b) => b.giroSemanal - a.giroSemanal)
    .slice(0, 5);
    
  // Prepare data for pie chart
  const dadosGraficoPDVsPorStatus = [
    { name: 'Ativos', value: dashboardData.contadoresStatus.ativos },
    { name: 'Em análise', value: dashboardData.contadoresStatus.emAnalise },
    { name: 'A ativar', value: dashboardData.contadoresStatus.aAtivar },
    { name: 'Standby', value: dashboardData.contadoresStatus.standby },
    { name: 'Inativos', value: dashboardData.contadoresStatus.inativos }
  ];
    
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          title="Faturamento Mensal"
          value={`R$ ${faturamentoMensal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
          icon={<ShoppingBag className="h-5 w-5" />}
          description="Faturamento previsto (DRE)"
          trend={{ value: 3.2, isPositive: true }}
        />
        
        <StatusCard
          title="PDVs Ativos"
          value={dashboardData.contadoresStatus.ativos}
          icon={<Users className="h-5 w-5" />}
          description="Total de pontos de venda ativos"
        />
        
        <StatusCard
          title="Produção Realizada"
          value={`${percentualProducao.toFixed(1)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          description="Vs planejamento mensal"
          trend={{ value: percentualProducao - 95, isPositive: percentualProducao >= 95 }}
        />
        
        <StatusCard
          title="Ticket Médio"
          value={`R$ ${ticketMedio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
          icon={<Calendar className="h-5 w-5" />}
          description="Por PDV ativo"
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="flex flex-col">
            <StatsPieChart 
              title="Distribuição de PDVs por Status"
              description="Visão geral dos pontos de venda por status"
              data={dadosGraficoPDVsPorStatus}
              colors={['#4ade80', '#60a5fa', '#facc15', '#c084fc', '#f87171']}
            />
            <div className="flex justify-end mt-2">
              <Button variant="ghost" asChild className="text-xs">
                <Link to="/clientes" className="flex items-center">
                  Ver detalhes <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-3">
          <div className="flex flex-col">
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
            <div className="flex justify-end mt-2">
              <Button variant="ghost" asChild className="text-xs">
                <Link to="/projecoes" className="flex items-center">
                  Ver projeções <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col">
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
                    <ArrowRight className="h-4 w-4 text-green-500 ml-2" />
                  </div>
                )
              }
            ]}
          />
          <div className="flex justify-end mt-2">
            <Button variant="ghost" asChild className="text-xs">
              <Link to="/clientes" className="flex items-center">
                Ver todos clientes <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col">
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
          <div className="flex justify-end mt-2">
            <Button variant="ghost" asChild className="text-xs">
              <Link to="/agendamento" className="flex items-center">
                Ver agendamentos <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
