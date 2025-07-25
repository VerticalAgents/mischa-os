
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, TrendingUp, TrendingDown, Minus, Search } from 'lucide-react';
import { DadosAnaliseGiroConsolidados, GiroRanking } from '@/types/giroAnalysis';

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
  const [filterPerformance, setFilterPerformance] = useState('');

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

  // Preparar dados do ranking baseado nos dados consolidados
  const rankingData = dadosConsolidados
    .filter(item => 
      item.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!filterPerformance || item.semaforo_performance === filterPerformance)
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
    .slice(0, 50); // Limitar a 50 resultados

  const getTrendIcon = (variacao: number) => {
    if (variacao > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (variacao < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getPerformanceBadge = (performance: string) => {
    const variants = {
      verde: 'bg-green-100 text-green-800',
      amarelo: 'bg-yellow-100 text-yellow-800',
      vermelho: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge variant="secondary" className={variants[performance as keyof typeof variants]}>
        {performance}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Ranking de Clientes por Giro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="giro_atual">Giro Atual</SelectItem>
                <SelectItem value="achievement">Achievement</SelectItem>
                <SelectItem value="variacao">Variação %</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPerformance} onValueChange={setFilterPerformance}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por performance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="verde">🟢 Verde</SelectItem>
                <SelectItem value="amarelo">🟡 Amarelo</SelectItem>
                <SelectItem value="vermelho">🔴 Vermelho</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {rankingData.slice(0, 3).map((item, index) => (
          <Card key={item.cliente_id} className="relative">
            <div className="absolute top-4 right-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
              }`}>
                {index + 1}
              </div>
            </div>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">{item.cliente_nome}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{item.giro_semanal_calculado.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">un/semana</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {getTrendIcon(item.variacao_percentual)}
                    <span className="text-sm font-medium">
                      {item.variacao_percentual > 0 ? '+' : ''}{item.variacao_percentual.toFixed(1)}%
                    </span>
                  </div>
                  {getPerformanceBadge(item.semaforo_performance)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabela completa */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking Completo</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Pos.</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Representante</TableHead>
                <TableHead>Rota</TableHead>
                <TableHead className="text-right">Giro Atual</TableHead>
                <TableHead className="text-right">Giro Médio</TableHead>
                <TableHead className="text-right">Achievement</TableHead>
                <TableHead className="text-right">Variação</TableHead>
                <TableHead className="text-center">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankingData.map((item, index) => (
                <TableRow key={item.cliente_id}>
                  <TableCell className="font-medium">#{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.cliente_nome}</TableCell>
                  <TableCell>{item.representante_nome || '-'}</TableCell>
                  <TableCell>{item.rota_entrega_nome || '-'}</TableCell>
                  <TableCell className="text-right font-mono">
                    {item.giro_semanal_calculado.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {item.giro_medio_historico.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {item.achievement_meta.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {getTrendIcon(item.variacao_percentual)}
                      <span className="font-mono">
                        {item.variacao_percentual > 0 ? '+' : ''}{item.variacao_percentual.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getPerformanceBadge(item.semaforo_performance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
