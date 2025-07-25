
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { DadosAnaliseGiroConsolidados, GiroRanking } from '@/types/giroAnalysis';
import { RankingFilters } from './components/RankingFilters';
import { TopClientesCards } from './components/TopClientesCards';
import { RankingClientesTable } from './components/RankingClientesTable';

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
  const [sortBy, setSortBy] = useState('giro_atual');
  const [filterPerformance, setFilterPerformance] = useState('todos');

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

  // Filtrar e ordenar dados
  const dadosFiltrados = dadosConsolidados
    .filter(item => 
      item.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterPerformance === 'todos' || item.semaforo_performance === filterPerformance)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'giro_atual':
          return b.giro_semanal_calculado - a.giro_semanal_calculado;
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
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Ranking de Clientes por Giro
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
