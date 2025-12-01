import { Users, TrendingUp, Activity } from 'lucide-react';
import { useClienteStore } from '@/hooks/useClienteStore';
import { useGiroMedioPorPDV } from '@/hooks/useGiroMedioPorPDV';
import { useNavigate } from 'react-router-dom';
import IndicadorCardComTooltip from '@/components/common/IndicadorCardComTooltip';
import { GIRO_TOOLTIPS } from '@/data/indicadoresTooltips';

export default function HomeIndicadoresClientes() {
  const navigate = useNavigate();
  const { clientes, loading: clientesLoading } = useClienteStore();
  const { giroTotal, giroMedioPorPDV, isLoading: giroLoading } = useGiroMedioPorPDV();

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
      
      <IndicadorCardComTooltip
        title="Giro Semanal Total"
        value={giroTotal.toLocaleString()}
        subtitle="Soma dos PDVs ativos"
        icon={TrendingUp}
        isLoading={isLoading}
        tooltip={GIRO_TOOLTIPS.giroSemanalTotal}
        onClick={() => navigate('/gestao-comercial?tab=representantes')}
      />
      
      <IndicadorCardComTooltip
        title="Giro Médio por PDV"
        value={giroMedioPorPDV.toLocaleString()}
        subtitle="Apenas PDVs ativos"
        icon={Activity}
        isLoading={isLoading}
        tooltip={GIRO_TOOLTIPS.giroMedioPorPDV}
        onClick={() => navigate('/gestao-comercial?tab=representantes')}
      />
    </div>
  );
}
