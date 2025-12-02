import { Users, TrendingUp, Activity } from 'lucide-react';
import { useGiroMedioPorPDV } from '@/hooks/useGiroMedioPorPDV';
import { useNavigate } from 'react-router-dom';
import IndicadorCardComTooltip from '@/components/common/IndicadorCardComTooltip';
import IndicadorCardComTendencia from '@/components/common/IndicadorCardComTendencia';
import { GIRO_TOOLTIPS } from '@/data/indicadoresTooltips';

export default function HomeIndicadoresClientes() {
  const navigate = useNavigate();
  const { 
    totalPDVs,
    pdvsDiretos,
    pdvsViaDistribuidores,
    giro4Semanas,
    giroMedio4Semanas,
    variacaoGiroTotal,
    variacaoGiroMedio,
    isLoading: giroLoading 
  } = useGiroMedioPorPDV();

  // Construir subtítulo dinâmico
  const pdvSubtitle = pdvsViaDistribuidores > 0
    ? `${pdvsDiretos} diretos + ${pdvsViaDistribuidores} via distribuidores`
    : `${pdvsDiretos} diretos`;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <IndicadorCardComTooltip
        title="Total de PDVs"
        value={totalPDVs}
        subtitle={pdvSubtitle}
        icon={Users}
        isLoading={giroLoading}
        tooltip={GIRO_TOOLTIPS.clientesAtivos}
        onClick={() => navigate('/clientes')}
      />
      
      <IndicadorCardComTendencia
        title="Giro Semanal Total"
        value={giro4Semanas.toLocaleString()}
        subtitle="Média das últimas 4 semanas"
        icon={TrendingUp}
        isLoading={giroLoading}
        tooltip={GIRO_TOOLTIPS.giroSemanalTotal}
        onClick={() => navigate('/insights-pdv')}
        variacao={variacaoGiroTotal}
        variacaoLabel="vs histórico"
      />
      
      <IndicadorCardComTendencia
        title="Giro Médio por PDV"
        value={giroMedio4Semanas.toLocaleString()}
        subtitle="Média das últimas 4 semanas"
        icon={Activity}
        isLoading={giroLoading}
        tooltip={GIRO_TOOLTIPS.giroMedioPorPDV}
        onClick={() => navigate('/insights-pdv')}
        variacao={variacaoGiroMedio}
        variacaoLabel="vs histórico"
      />
    </div>
  );
}
