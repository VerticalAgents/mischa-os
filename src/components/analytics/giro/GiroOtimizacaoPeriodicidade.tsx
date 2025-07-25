
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Search, BarChart3 } from 'lucide-react';
import { DadosAnaliseGiroConsolidados } from '@/types/giroAnalysis';
import { GiroComparativoTable } from './components/GiroComparativoTable';

interface GiroOtimizacaoPeriodicidadeProps {
  dadosConsolidados: DadosAnaliseGiroConsolidados[];
  isLoading: boolean;
}

export function GiroOtimizacaoPeriodicidade({ dadosConsolidados, isLoading }: GiroOtimizacaoPeriodicidadeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

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

  // Filtrar dados
  const dadosFiltrados = dadosConsolidados
    .filter(item => {
      const matchesSearch = item.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filtroStatus === 'todos') return matchesSearch;
      
      const giroProjetado = item.quantidade_padrao && item.periodicidade_padrao 
        ? Math.round((item.quantidade_padrao / item.periodicidade_padrao) * 7)
        : 0;
      
      if (giroProjetado === 0) return false;
      
      const diferenca = ((item.giro_medio_historico - giroProjetado) / giroProjetado) * 100;
      
      if (filtroStatus === 'ajustado') return diferenca >= -10 && diferenca <= 10;
      if (filtroStatus === 'acima') return diferenca > 10;
      if (filtroStatus === 'abaixo') return diferenca < -10;
      
      return matchesSearch;
    })
    .sort((a, b) => b.giro_medio_historico - a.giro_medio_historico);

  // Estatísticas resumo
  const totalClientes = dadosFiltrados.length;
  const clientesAjustados = dadosFiltrados.filter(item => {
    const giroProjetado = item.quantidade_padrao && item.periodicidade_padrao 
      ? Math.round((item.quantidade_padrao / item.periodicidade_padrao) * 7)
      : 0;
    if (giroProjetado === 0) return false;
    const diferenca = ((item.giro_medio_historico - giroProjetado) / giroProjetado) * 100;
    return diferenca >= -10 && diferenca <= 10;
  }).length;

  const clientesAcima = dadosFiltrados.filter(item => {
    const giroProjetado = item.quantidade_padrao && item.periodicidade_padrao 
      ? Math.round((item.quantidade_padrao / item.periodicidade_padrao) * 7)
      : 0;
    if (giroProjetado === 0) return false;
    const diferenca = ((item.giro_medio_historico - giroProjetado) / giroProjetado) * 100;
    return diferenca > 10;
  }).length;

  const clientesAbaixo = dadosFiltrados.filter(item => {
    const giroProjetado = item.quantidade_padrao && item.periodicidade_padrao 
      ? Math.round((item.quantidade_padrao / item.periodicidade_padrao) * 7)
      : 0;
    if (giroProjetado === 0) return false;
    const diferenca = ((item.giro_medio_historico - giroProjetado) / giroProjetado) * 100;
    return diferenca < -10;
  }).length;

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
                <p className="text-2xl font-bold">{totalClientes}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ajustados</p>
                <p className="text-2xl font-bold text-green-600">{clientesAjustados}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Acima do Projetado</p>
                <p className="text-2xl font-bold text-blue-600">{clientesAcima}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Abaixo do Projetado</p>
                <p className="text-2xl font-bold text-red-600">{clientesAbaixo}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Análise Comparativa de Giro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
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
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ajustado">🟢 Ajustado</SelectItem>
                <SelectItem value="acima">🔵 Acima</SelectItem>
                <SelectItem value="abaixo">🔴 Abaixo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela comparativa */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativo Giro Histórico vs Projetado</CardTitle>
        </CardHeader>
        <CardContent>
          <GiroComparativoTable dados={dadosFiltrados} />
        </CardContent>
      </Card>
    </div>
  );
}
