
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Calendar } from 'lucide-react';
import { useCurvaABC } from '@/hooks/useCurvaABC';
import { CurvaABCCards } from './components/CurvaABCCards';
import { CurvaABCCharts } from './components/CurvaABCCharts';
import { CurvaABCTable } from './components/CurvaABCTable';
import { GiroAnalysisFilters } from '@/types/giroAnalysis';

interface GiroRankingClientesProps {
  filtros?: GiroAnalysisFilters;
}

export function GiroRankingClientes({ filtros = {} }: GiroRankingClientesProps) {
  const [periodo, setPeriodo] = useState('90d');
  
  const { 
    clientesABC, 
    resumoCategorias, 
    dadosGraficos, 
    isLoading,
    faturamentoTotal
  } = useCurvaABC(periodo, filtros);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Estado de erro (se não houver dados após carregamento)
  if (!isLoading && clientesABC.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum dado de faturamento encontrado para o período selecionado.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Verifique se existem entregas registradas no histórico.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Filtro de Período */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Análise Curva ABC</h2>
          <p className="text-sm text-muted-foreground">
            Classificação de clientes por faturamento (Pareto 80/15/5)
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="ano">Ano atual</SelectItem>
              <SelectItem value="todo">Todo o período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Faturamento Total */}
      {!isLoading && (
        <div className="text-center py-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">Faturamento Total no Período</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(faturamentoTotal)}</p>
        </div>
      )}

      {/* Cards de KPIs */}
      <CurvaABCCards resumoCategorias={resumoCategorias} isLoading={isLoading} />

      {/* Gráficos */}
      <CurvaABCCharts 
        dadosPie={dadosGraficos.pie} 
        dadosBar={dadosGraficos.bar} 
        isLoading={isLoading} 
      />

      {/* Tabela Detalhada */}
      <CurvaABCTable clientes={clientesABC} isLoading={isLoading} />
    </div>
  );
}

