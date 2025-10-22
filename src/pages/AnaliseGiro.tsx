
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Users, Package, Settings, Target } from 'lucide-react';
import { useGiroAnalysisConsolidated } from '@/hooks/useGiroAnalysisConsolidated';
import { GiroAnalysisFiltersComponent } from '@/components/analytics/giro/GiroAnalysisFilters';
import { GiroOverviewCards } from '@/components/analytics/giro/GiroOverviewCards';
import { GiroDashboardGeral } from '@/components/analytics/giro/GiroDashboardGeral';
import { GiroOverviewGeneral } from '@/components/analytics/giro/GiroOverviewGeneral';
import { GiroRankingClientes } from '@/components/analytics/giro/GiroRankingClientes';
import { GiroPorCategoria } from '@/components/analytics/giro/GiroPorCategoria';
import { GiroSimuladorCenarios } from '@/components/analytics/giro/GiroSimuladorCenarios';
import { GiroOtimizacaoPeriodicidade } from '@/components/analytics/giro/GiroOtimizacaoPeriodicidade';
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

  // Extrair listas únicas para filtros
  const representantes = [...new Set(dadosConsolidados.map(d => d.representante_nome).filter(Boolean))];
  const rotas = [...new Set(dadosConsolidados.map(d => d.rota_entrega_nome).filter(Boolean))];
  const categorias = [...new Set(dadosConsolidados.map(d => d.categoria_estabelecimento_nome).filter(Boolean))];

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
          <h1 className="text-3xl font-bold">Análise de Giro</h1>
          <p className="text-muted-foreground">
            Gestão inteligente do giro de produtos por cliente
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

      {overview && <GiroOverviewCards overview={overview} />}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="visao-geral" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="ranking" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Ranking de Clientes
          </TabsTrigger>
          <TabsTrigger value="categoria" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Giro por Categoria
          </TabsTrigger>
          <TabsTrigger value="simulador" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Simulador de Cenários
          </TabsTrigger>
          <TabsTrigger value="otimizacao" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Otimização de Periodicidade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <GiroDashboardGeral />
        </TabsContent>

        <TabsContent value="visao-geral" className="space-y-6">
          <GiroOverviewGeneral 
            dadosConsolidados={dadosConsolidados}
            overview={overview}
            regional={regional}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="ranking" className="space-y-6">
          <GiroRankingClientes
            dadosConsolidados={dadosConsolidados}
            ranking={ranking}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="categoria" className="space-y-6">
          <GiroPorCategoria
            dadosConsolidados={dadosConsolidados}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="simulador" className="space-y-6">
          <GiroSimuladorCenarios
            dadosConsolidados={dadosConsolidados}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="otimizacao" className="space-y-6">
          <GiroOtimizacaoPeriodicidade
            dadosConsolidados={dadosConsolidados}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
