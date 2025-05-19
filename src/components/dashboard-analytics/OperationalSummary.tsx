
import { ArrowUpRight, BarChart, Users, Calendar, MessageCircle, CalendarDays } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import StatusCard from "@/components/dashboard/StatusCard";
import StatsBarChart from "@/components/dashboard/StatsBarChart";
import StatsPieChart from "@/components/dashboard/StatsPieChart";
import StatsTable from "@/components/dashboard/StatsTable";
import { useConfirmacaoReposicaoStore } from "@/hooks/useConfirmacaoReposicaoStore";
import { useDashboardStore } from "@/hooks/useDashboardStore";
import { useMemo } from "react";

export default function OperationalSummary({ dashboardData, baseDRE, clientes }: any) {
  // Call the hooks outside of render paths and get data once
  const confirmacaoStats = useConfirmacaoReposicaoStore(state => state.getConfirmacaoStats());
  
  // Use useMemo to extract data from dashboardStore to prevent recalculation on every render
  const statusData = useMemo(() => {
    return [
      { name: 'Ativos', value: dashboardData.contadoresStatus.ativos },
      { name: 'Em análise', value: dashboardData.contadoresStatus.emAnalise },
      { name: 'A ativar', value: dashboardData.contadoresStatus.aAtivar },
      { name: 'Standby', value: dashboardData.contadoresStatus.standby },
      { name: 'Inativos', value: dashboardData.contadoresStatus.inativos }
    ];
  }, [dashboardData.contadoresStatus]);
  
  // Format top PDVs data once using useMemo
  const topPDVsData = useMemo(() => {
    return dashboardData.giroMedioSemanalPorPDV
      .sort((a: any, b: any) => b.giroSemanal - a.giroSemanal)
      .slice(0, 5)
      .map((pdv: any) => ({
        name: pdv.nomeCliente,
        value: Math.round(pdv.giroSemanal)
      }));
  }, [dashboardData.giroMedioSemanalPorPDV]);
  
  // Status colors
  const getStatusColor = (count: number, threshold1: number, threshold2: number) => {
    if (count === 0) return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    if (count <= threshold1) return "bg-green-100 text-green-800 hover:bg-green-200";
    if (count <= threshold2) return "bg-amber-100 text-amber-800 hover:bg-amber-200";
    return "bg-red-100 text-red-800 hover:bg-red-200";
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          title="PDVs Ativos"
          value={dashboardData.contadoresStatus.ativos}
          icon={<Users className="h-5 w-5" />}
          description="Total de pontos de venda ativos"
        />
        
        <StatusCard
          title="Giro Médio Semanal"
          value={Math.round(dashboardData.giroMedioSemanalGeral).toLocaleString()}
          icon={<BarChart className="h-5 w-5" />}
          description="Brownies por semana"
          trend={{ value: 5.2, isPositive: true }}
        />
        
        <StatusCard
          title="Previsão Mensal"
          value={Math.round(dashboardData.previsaoGiroTotalMensal).toLocaleString()}
          icon={<Calendar className="h-5 w-5" />}
          description="Brownies por mês"
        />
        
        <StatusCard
          title="Próximas Entregas"
          // Assuming pedidosFuturos is defined elsewhere in your app
          value={10} // Replace with actual value
          icon={<CalendarDays className="h-5 w-5" />}
          description="Pedidos agendados"
        />
      </div>
      
      {/* Reposition Confirmation Widget */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <MessageCircle className="h-5 w-5 mr-2 text-blue-500" />
            Confirmação de Reposição
          </CardTitle>
          <CardDescription>Resumo de PDVs aguardando confirmação</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-3 rounded-lg ${getStatusColor(confirmacaoStats.contatarHoje, 3, 6)}`}>
              <div className="text-2xl font-bold">{confirmacaoStats.contatarHoje}</div>
              <div className="text-xs">A contatar hoje</div>
            </div>
            
            <div className={`p-3 rounded-lg ${getStatusColor(confirmacaoStats.contatoPendente, 2, 4)}`}>
              <div className="text-2xl font-bold">{confirmacaoStats.contatoPendente}</div>
              <div className="text-xs">Contato pendente</div>
            </div>
            
            <div className={`p-3 rounded-lg ${getStatusColor(confirmacaoStats.semResposta1, 2, 5)}`}>
              <div className="text-2xl font-bold">{confirmacaoStats.semResposta1}</div>
              <div className="text-xs">Sem resposta (1º contato)</div>
            </div>
            
            <div className={`p-3 rounded-lg ${getStatusColor(confirmacaoStats.semResposta2, 1, 3)}`}>
              <div className="text-2xl font-bold">{confirmacaoStats.semResposta2}</div>
              <div className="text-xs">Sem resposta (2º contato)</div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/agendamento?tab=confirmacao">
              <span>Ir para Confirmação de Reposição</span>
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <StatsPieChart 
            title="Distribuição de PDVs por Status"
            description="Visão geral dos pontos de venda por status"
            data={statusData}
            colors={['#4ade80', '#60a5fa', '#facc15', '#c084fc', '#f87171']}
          />
        </div>
        
        <div className="md:col-span-3">
          <StatsBarChart 
            title="Top 5 PDVs por Giro Semanal"
            description="Maiores volumes de venda por semana"
            data={topPDVsData}
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
          data={dashboardData.giroMedioSemanalPorPDV
            .sort((a: any, b: any) => b.giroSemanal - a.giroSemanal)
            .slice(0, 5)}
          columns={[
            {
              header: "Cliente",
              accessorKey: "nomeCliente"
            },
            {
              header: "Giro Semanal",
              accessorKey: (item: any) => Math.round(item.giroSemanal).toLocaleString(),
              cell: (item: any) => (
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
          data={[]} // Replace with your data
          columns={[
            {
              header: "Cliente",
              accessorKey: (item: any) => item.cliente?.nome
            },
            {
              header: "Data Prevista",
              accessorKey: (item: any) => new Date(item.dataPrevistaEntrega).toLocaleDateString()
            },
            {
              header: "Qtde.",
              accessorKey: "totalPedidoUnidades"
            }
          ]}
        />
      </div>
    </div>
  );
}
