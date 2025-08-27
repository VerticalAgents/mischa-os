import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, Target, Activity, DollarSign } from "lucide-react";
import TooltipExplicativo, { ExplicacaoCalculoProps } from "@/components/common/TooltipExplicativo";
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

// Explicações detalhadas para cada indicador
const explicacoes: Record<string, ExplicacaoCalculoProps> = {
  totalClientes: {
    titulo: "Total de Clientes",
    explicacao: "Número total de clientes cadastrados para o representante selecionado, incluindo todos os status.",
    observacoes: [
      "Inclui clientes ativos, inativos, em análise, standby e pipeline",
      "Considera apenas clientes do representante selecionado",
      "Atualizado em tempo real conforme cadastros"
    ],
    fontes: ["Base de Clientes", "Cadastro de Representantes"]
  },
  giroTotal: {
    titulo: "Giro Semanal Total",
    explicacao: "Soma do giro semanal de todos os clientes ativos do representante, calculado com base no histórico real de entregas.",
    formula: "Σ(Giro Semanal de cada Cliente Ativo)",
    exemplo: "Cliente A: 20/sem + Cliente B: 15/sem + Cliente C: 25/sem = 60 total",
    observacoes: [
      "Considera apenas clientes com status 'Ativo'",
      "Baseado em dados reais de entrega, não estimativas",
      "Atualizado automaticamente com novas entregas"
    ],
    fontes: ["Histórico de Entregas", "Status dos Clientes"]
  },
  giroMedio: {
    titulo: "Giro Médio por PDV",
    explicacao: "Média aritmética do giro semanal dos PDVs ativos, representando a performance média de cada ponto de venda.",
    formula: "Giro Total ÷ Número de Clientes Ativos",
    exemplo: "Giro total 200, 10 ativos = 20 unidades/PDV/semana",
    observacoes: [
      "Exclui clientes inativos do cálculo",
      "Útil para comparar performance entre representantes",
      "Indica potencial de crescimento por PDV"
    ],
    fontes: ["Giro Total Calculado", "Contagem de Ativos"]
  },
  taxaConversao: {
    titulo: "Taxa de Conversão",
    explicacao: "Percentual de clientes que estão ativos em relação ao total de clientes do representante.",
    formula: "(Clientes Ativos ÷ Total de Clientes) × 100",
    exemplo: "20 ativos de 50 total = 40% de conversão",
    observacoes: [
      "Indica eficiência na ativação de clientes",
      "Meta sugerida: acima de 60%",
      "Considera todos os clientes cadastrados"
    ],
    fontes: ["Status dos Clientes", "Base Total de Clientes"]
  },
  emAnalise: {
    titulo: "Clientes em Análise",
    explicacao: "Número de clientes com status 'Em análise', representando o pipeline de ativação do representante.",
    observacoes: [
      "Clientes em processo de avaliação",
      "Potencial de conversão para ativos",
      "Requer acompanhamento próximo"
    ],
    fontes: ["Status dos Clientes"]
  }
};

const IndicadorCard = memo(({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  isLoading,
  explicacao
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  isLoading: boolean;
  explicacao: ExplicacaoCalculoProps;
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
    <TooltipExplicativo 
      explicacao={explicacao}
      variant="indicator"
    >
      <Card className="transition-all duration-200 hover:shadow-md cursor-help">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-left">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-left">{value}</div>
          <p className="text-xs text-muted-foreground text-left">{subtitle}</p>
        </CardContent>
      </Card>
    </TooltipExplicativo>
  );
});

IndicadorCard.displayName = 'IndicadorCard';

export default function RepresentantesIndicadoresOptimized({ 
  data, 
  isLoading 
}: RepresentantesIndicadoresOptimizedProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <IndicadorCard
        title="Total de Clientes"
        value={data.totalClientes}
        subtitle={`${data.clientesAtivos} ativos`}
        icon={Users}
        isLoading={isLoading}
        explicacao={explicacoes.totalClientes}
      />
      
      <IndicadorCard
        title="Giro Semanal Total"
        value={data.giroTotalReal.toLocaleString()}
        subtitle="Soma dos ativos"
        icon={TrendingUp}
        isLoading={isLoading}
        explicacao={explicacoes.giroTotal}
      />
      
      <IndicadorCard
        title="Giro Médio por PDV"
        value={data.giroMedioPorPDV.toLocaleString()}
        subtitle="Apenas PDVs ativos"
        icon={DollarSign}
        isLoading={isLoading}
        explicacao={explicacoes.giroMedio}
      />
      
      <IndicadorCard
        title="Taxa de Conversão"
        value={`${data.taxaConversao.toFixed(1)}%`}
        subtitle="Clientes ativos / Total"
        icon={Target}
        isLoading={isLoading}
        explicacao={explicacoes.taxaConversao}
      />
      
      <IndicadorCard
        title="Em Análise"
        value={data.clientesEmAnalise}
        subtitle="Aguardando ativação"
        icon={Activity}
        isLoading={isLoading}
        explicacao={explicacoes.emAnalise}
      />
    </div>
  );
}