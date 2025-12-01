import { Users, TrendingUp, Activity } from 'lucide-react';
import { useClienteStore } from '@/hooks/useClienteStore';
import { useGiroMedioPorPDV } from '@/hooks/useGiroMedioPorPDV';
import { useNavigate } from 'react-router-dom';
import IndicadorCardComTooltip from '@/components/common/IndicadorCardComTooltip';
import IndicadorCardComTendencia from '@/components/common/IndicadorCardComTendencia';
import { GIRO_TOOLTIPS } from '@/data/indicadoresTooltips';

export default function HomeIndicadoresClientes() {
  const navigate = useNavigate();
  const { clientes, loading: clientesLoading } = useClienteStore();
  const { 
    giroTotal, 
    giroMedioPorPDV, 
    giro4Semanas,
    giroMedio4Semanas,
    variacaoGiroTotal,
    variacaoGiroMedio,
    isLoading: giroLoading 
  } = useGiroMedioPorPDV();

  const clientesAtivos = clientes.filter(c => c.statusCliente === 'Ativo');
  const totalClientes = clientes.length;
  const totalAtivos = clientesAtivos.length;

  const isLoading = clientesLoading || giroLoading;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <IndicadorCardComTooltip
        title="Clientes Ativos"
        value={totalAtivos}
        subtitle={`${totalClientes} total`}
        icon={Users}
        isLoading={isLoading}
        tooltip={GIRO_TOOLTIPS.clientesAtivos}
        onClick={() => navigate('/clientes')}
      />
      
      <IndicadorCardComTendencia
        title="Giro Semanal Total"
        value={giro4Semanas.toLocaleString()}
        subtitle="Média das últimas 4 semanas"
        icon={TrendingUp}
        isLoading={isLoading}
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
        isLoading={isLoading}
        tooltip={GIRO_TOOLTIPS.giroMedioPorPDV}
        onClick={() => navigate('/insights-pdv')}
        variacao={variacaoGiroMedio}
        variacaoLabel="vs histórico"
      />
    </div>
  );
}
