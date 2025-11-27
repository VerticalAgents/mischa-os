import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, TrendingUp, Activity } from 'lucide-react';
import { useClienteStore } from '@/hooks/useClienteStore';
import { useNavigate } from 'react-router-dom';

const IndicadorCard = memo(({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  isLoading,
  onClick
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  isLoading: boolean;
  onClick?: () => void;
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-left">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-left">{value}</div>
        <p className="text-xs text-muted-foreground text-left">{subtitle}</p>
      </CardContent>
    </Card>
  );
});

IndicadorCard.displayName = 'IndicadorCard';

export default function HomeIndicadoresClientes() {
  const navigate = useNavigate();
  const { clientes, loading } = useClienteStore();

  const indicadores = useMemo(() => {
    const clientesAtivos = clientes.filter(c => c.statusCliente === 'Ativo');
    const totalClientes = clientes.length;
    const totalAtivos = clientesAtivos.length;
    
    // Giro semanal total (soma dos giros médios semanais dos clientes ativos)
    const giroSemanalTotal = clientesAtivos.reduce((acc, c) => acc + (c.giroMedioSemanal || 0), 0);
    
    // Giro médio por PDV
    const giroMedioPorPDV = totalAtivos > 0 
      ? Math.round(giroSemanalTotal / totalAtivos) 
      : 0;

    return {
      totalClientes,
      totalAtivos,
      giroSemanalTotal,
      giroMedioPorPDV
    };
  }, [clientes]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <IndicadorCard
        title="Total de Clientes"
        value={indicadores.totalClientes}
        subtitle={`${indicadores.totalAtivos} ativos`}
        icon={Users}
        isLoading={loading}
        onClick={() => navigate('/clientes')}
      />
      
      <IndicadorCard
        title="Giro Semanal Total"
        value={indicadores.giroSemanalTotal.toLocaleString()}
        subtitle="Soma dos PDVs ativos"
        icon={TrendingUp}
        isLoading={loading}
        onClick={() => navigate('/gestao-comercial?tab=representantes')}
      />
      
      <IndicadorCard
        title="Giro Médio por PDV"
        value={indicadores.giroMedioPorPDV.toLocaleString()}
        subtitle="Apenas PDVs ativos"
        icon={Activity}
        isLoading={loading}
        onClick={() => navigate('/gestao-comercial?tab=representantes')}
      />
    </div>
  );
}
