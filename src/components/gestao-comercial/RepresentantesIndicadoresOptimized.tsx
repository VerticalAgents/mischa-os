import { Users, TrendingUp, Target, Activity, DollarSign } from "lucide-react";
import IndicadorCardComTooltip from "@/components/common/IndicadorCardComTooltip";
import { GIRO_TOOLTIPS } from "@/data/indicadoresTooltips";
import { memo } from "react";

interface IndicadoresData {
  totalClientes: number;
  clientesAtivos: number;
  giroTotalReal: number;
  giroMedioPorPDV: number;
  taxaConversao: number;
  clientesEmAnalise: number;
}

interface RepresentantesIndicadoresOptimizedProps {
  data: IndicadoresData;
  isLoading: boolean;
}

const RepresentantesIndicadoresOptimized = memo(({ 
  data, 
  isLoading 
}: RepresentantesIndicadoresOptimizedProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <IndicadorCardComTooltip
        title="Total de Clientes"
        value={data.totalClientes}
        subtitle={`${data.clientesAtivos} ativos`}
        icon={Users}
        isLoading={isLoading}
        tooltip={GIRO_TOOLTIPS.totalClientes}
      />
      
      <IndicadorCardComTooltip
        title="Giro Semanal Total"
        value={data.giroTotalReal.toLocaleString()}
        subtitle="Soma dos ativos"
        icon={TrendingUp}
        isLoading={isLoading}
        tooltip={GIRO_TOOLTIPS.giroSemanalTotal}
      />
      
      <IndicadorCardComTooltip
        title="Giro Médio por PDV"
        value={data.giroMedioPorPDV.toLocaleString()}
        subtitle="Apenas PDVs ativos"
        icon={DollarSign}
        isLoading={isLoading}
        tooltip={GIRO_TOOLTIPS.giroMedioPorPDV}
      />
      
      <IndicadorCardComTooltip
        title="Taxa de Conversão"
        value={`${data.taxaConversao.toFixed(1)}%`}
        subtitle="Clientes ativos / Total"
        icon={Target}
        isLoading={isLoading}
        tooltip={GIRO_TOOLTIPS.taxaConversao}
      />
      
      <IndicadorCardComTooltip
        title="Em Análise"
        value={data.clientesEmAnalise}
        subtitle="Aguardando ativação"
        icon={Activity}
        isLoading={isLoading}
        tooltip={GIRO_TOOLTIPS.clientesEmAnalise}
      />
    </div>
  );
});

RepresentantesIndicadoresOptimized.displayName = 'RepresentantesIndicadoresOptimized';

export default RepresentantesIndicadoresOptimized;
