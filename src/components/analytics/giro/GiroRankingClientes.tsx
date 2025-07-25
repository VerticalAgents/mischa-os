
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Bug, ArrowLeft } from 'lucide-react';
import { DadosAnaliseGiroConsolidados, GiroRanking } from '@/types/giroAnalysis';
import { RankingFilters } from './components/RankingFilters';
import { TopClientesCards } from './components/TopClientesCards';
import { RankingClientesTable } from './components/RankingClientesTable';
import { DebugClientesCarregamento } from './components/DebugClientesCarregamento';

interface GiroRankingClientesProps {
  dadosConsolidados: DadosAnaliseGiroConsolidados[];
  ranking: GiroRanking[];
  isLoading: boolean;
}

export function GiroRankingClientes({ 
  dadosConsolidados, 
  ranking, 
  isLoading 
}: GiroRankingClientesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('giro_historico');
  const [filterPerformance, setFilterPerformance] = useState('todos');
  const [mostrarDebugCarregamento, setMostrarDebugCarregamento] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se está mostrando o debug de carregamento, renderizar apenas ele
  if (mostrarDebugCarregamento) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setMostrarDebugCarregamento(false)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h2 className="text-lg font-semibold">Debug de Carregamento - Ranking de Clientes</h2>
        </div>
        <DebugClientesCarregamento 
          nomeAba="Ranking de Clientes"
          dadosConsolidados={dadosConsolidados}
        />
      </div>
    );
  }

  // Filtrar e ordenar dados
  const dadosFiltrados = dadosConsolidados
    .filter(item => 
      item.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterPerformance === 'todos' || item.semaforo_performance === filterPerformance)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'giro_historico':
          return b.giro_medio_historico - a.giro_medio_historico;
        case 'achievement':
          return b.achievement_meta - a.achievement_meta;
        case 'variacao':
          return b.variacao_percentual - a.variacao_percentual;
        default:
          return 0;
      }
    })
    .slice(0, 50);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Ranking de Clientes por Giro Histórico
            </span>
            <Button
              variant="outline"
              onClick={() => setMostrarDebugCarregamento(true)}
              className="flex items-center gap-2"
            >
              <Bug className="h-4 w-4" />
              Debug Carregamento
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RankingFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            onSortChange={setSortBy}
            filterPerformance={filterPerformance}
            onFilterPerformanceChange={setFilterPerformance}
          />
        </CardContent>
      </Card>

      <TopClientesCards dados={dadosFiltrados} />

      <Card>
        <CardHeader>
          <CardTitle>Ranking Completo</CardTitle>
        </CardHeader>
        <CardContent>
          <RankingClientesTable dados={dadosFiltrados} />
        </CardContent>
      </Card>
    </div>
  );
}
