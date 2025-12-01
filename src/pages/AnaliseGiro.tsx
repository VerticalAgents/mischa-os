
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Users, Package } from 'lucide-react';
import { useGiroAnalysisConsolidated } from '@/hooks/useGiroAnalysisConsolidated';
import { useClienteStore } from '@/hooks/useClienteStore';
import { GiroAnalysisFiltersComponent } from '@/components/analytics/giro/GiroAnalysisFilters';
import { GiroOverviewCards } from '@/components/analytics/giro/GiroOverviewCards';
import { GiroDashboardGeral } from '@/components/analytics/giro/GiroDashboardGeral';
import { GiroOverviewGeneral } from '@/components/analytics/giro/GiroOverviewGeneral';
import { GiroRankingClientes } from '@/components/analytics/giro/GiroRankingClientes';
import { GiroPorCategoria } from '@/components/analytics/giro/GiroPorCategoria';
import { GiroAnalysisFilters } from '@/types/giroAnalysis';

export default function AnaliseGiro() {
  const [filtros, setFiltros] = useState<GiroAnalysisFilters>({});
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const {
    dadosConsolidados,
    overview,
    ranking,
    regional,
    isLoading,
    isRefreshing,
    error,
    refreshAll
  } = useGiroAnalysisConsolidated(filtros);

  // Usar useClienteStore para obter dados corretos de clientes (mesmo que a página Início)
  const { clientes } = useClienteStore();

  // Extrair listas únicas para filtros
  const representantes = [...new Set(dadosConsolidados.map(d => d.representante_nome).filter(Boolean))];
  const rotas = [...new Set(dadosConsolidados.map(d => d.rota_entrega_nome).filter(Boolean))];
  const categorias = [...new Set(dadosConsolidados.map(d => d.categoria_estabelecimento_nome).filter(Boolean))];
  
  // Calcular clientes ativos e total usando a mesma lógica da página Início
  const { totalClientes, clientesAtivos } = useMemo(() => {
    const ativos = clientes.filter(c => c.statusCliente === 'Ativo').length;
    return {
      totalClientes: clientes.length,
      clientesAtivos: ativos
    };
  }, [clientes]);

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600">Erro ao carregar dados: {error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Insights PDV</h1>
          <p className="text-muted-foreground">
            Análises e métricas dos pontos de venda
          </p>
        </div>
      </div>

      <GiroAnalysisFiltersComponent
        filtros={filtros}
        onFiltrosChange={setFiltros}
        onRefresh={refreshAll}
        isRefreshing={isRefreshing}
        representantes={representantes}
        rotas={rotas}
        categorias={categorias}
      />

      {overview && <GiroOverviewCards overview={overview} totalClientes={totalClientes} clientesAtivos={clientesAtivos} />}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="ranking" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Curva ABC
          </TabsTrigger>
          <TabsTrigger value="visao-geral" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Rotas
          </TabsTrigger>
          <TabsTrigger value="categoria" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Categorias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <GiroDashboardGeral />
        </TabsContent>

        <TabsContent value="ranking" className="space-y-6">
          <GiroRankingClientes />
        </TabsContent>

        <TabsContent value="visao-geral" className="space-y-6">
          <GiroOverviewGeneral 
            dadosConsolidados={dadosConsolidados}
            overview={overview}
            regional={regional}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="categoria" className="space-y-6">
          <GiroPorCategoria
            dadosConsolidados={dadosConsolidados}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
