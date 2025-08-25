
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, Target, Activity, DollarSign } from "lucide-react";

interface IndicadoresData {
  totalClientes: number;
  clientesAtivos: number;
  giroTotalReal: number;
  giroMedioPorPDV: number;
  taxaConversao: number;
  clientesEmAnalise: number;
}

interface RepresentantesIndicadoresProps {
  data: IndicadoresData;
  isLoading: boolean;
}

const IndicadorCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  isLoading 
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  isLoading: boolean;
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
    <Card>
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
};

export default function RepresentantesIndicadores({ data, isLoading }: RepresentantesIndicadoresProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <IndicadorCard
        title="Total de Clientes"
        value={data.totalClientes}
        subtitle={`${data.clientesAtivos} ativos`}
        icon={Users}
        isLoading={isLoading}
      />
      
      <IndicadorCard
        title="Giro Semanal Total"
        value={data.giroTotalReal.toLocaleString()}
        subtitle="Soma dos ativos"
        icon={TrendingUp}
        isLoading={isLoading}
      />
      
      <IndicadorCard
        title="Giro Médio por PDV"
        value={data.giroMedioPorPDV.toLocaleString()}
        subtitle="Apenas PDVs ativos"
        icon={DollarSign}
        isLoading={isLoading}
      />
      
      <IndicadorCard
        title="Taxa de Conversão"
        value={`${data.taxaConversao.toFixed(1)}%`}
        subtitle="Clientes ativos / Total"
        icon={Target}
        isLoading={isLoading}
      />
      
      <IndicadorCard
        title="Em Análise"
        value={data.clientesEmAnalise}
        subtitle="Aguardando ativação"
        icon={Activity}
        isLoading={isLoading}
      />
    </div>
  );
}
