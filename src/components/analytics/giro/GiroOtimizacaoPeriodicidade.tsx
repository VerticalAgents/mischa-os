
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, TrendingUp, AlertTriangle, CheckCircle, Clock, Search } from 'lucide-react';
import { DadosAnaliseGiroConsolidados } from '@/types/giroAnalysis';

interface GiroOtimizacaoPeriodicidadeProps {
  dadosConsolidados: DadosAnaliseGiroConsolidados[];
  isLoading: boolean;
}

interface OtimizacaoSugestao {
  cliente_id: string;
  cliente_nome: string;
  periodicidade_atual: number;
  periodicidade_sugerida: number;
  giro_atual: number;
  giro_projetado: number;
  economia_operacional: number;
  impacto_faturamento: number;
  prioridade: 'alta' | 'media' | 'baixa';
  justificativa: string;
}

export function GiroOtimizacaoPeriodicidade({ dadosConsolidados, isLoading }: GiroOtimizacaoPeriodicidadeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtrosPrioridade, setFiltrosPrioridade] = useState('');
  const [sugestoesAplicadas, setSugestoesAplicadas] = useState<Set<string>>(new Set());

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

  // Gerar sugestões de otimização
  const gerarSugestoes = (): OtimizacaoSugestao[] => {
    return dadosConsolidados.map(item => {
      const periodicidadeAtual = item.periodicidade_padrao || 7;
      const giroAtual = item.giro_semanal_calculado;
      const achievementAtual = item.achievement_meta;
      
      let periodicidadeSugerida = periodicidadeAtual;
      let prioridade: 'alta' | 'media' | 'baixa' = 'baixa';
      let justificativa = '';
      
      // Lógica de otimização baseada no achievement e giro
      if (achievementAtual > 120 && giroAtual > item.giro_medio_historico * 1.2) {
        // Cliente com alta performance - pode reduzir periodicidade
        periodicidadeSugerida = Math.max(periodicidadeAtual - 2, 3);
        prioridade = 'alta';
        justificativa = 'Alto achievement e giro - reduzir periodicidade para otimizar operação';
      } else if (achievementAtual < 80 && giroAtual < item.giro_medio_historico * 0.8) {
        // Cliente com baixa performance - pode aumentar periodicidade
        periodicidadeSugerida = Math.min(periodicidadeAtual + 2, 14);
        prioridade = 'media';
        justificativa = 'Baixa performance - aumentar periodicidade para melhorar eficiência';
      } else if (achievementAtual > 100 && giroAtual > item.giro_medio_historico) {
        // Cliente com boa performance - ajuste moderado
        periodicidadeSugerida = Math.max(periodicidadeAtual - 1, 5);
        prioridade = 'media';
        justificativa = 'Boa performance - pequeno ajuste na periodicidade';
      }
      
      const giroProjetado = giroAtual * (periodicidadeAtual / periodicidadeSugerida);
      const economiaOperacional = ((periodicidadeAtual - periodicidadeSugerida) / periodicidadeAtual) * 100;
      const impactoFaturamento = ((giroProjetado - giroAtual) / giroAtual) * 100;
      
      return {
        cliente_id: item.cliente_id,
        cliente_nome: item.cliente_nome,
        periodicidade_atual: periodicidadeAtual,
        periodicidade_sugerida: periodicidadeSugerida,
        giro_atual: giroAtual,
        giro_projetado: giroProjetado,
        economia_operacional: economiaOperacional,
        impacto_faturamento: impactoFaturamento,
        prioridade,
        justificativa
      };
    }).filter(item => item.periodicidade_atual !== item.periodicidade_sugerida);
  };

  const sugestoes = gerarSugestoes()
    .filter(item => 
      item.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!filtrosPrioridade || item.prioridade === filtrosPrioridade)
    )
    .sort((a, b) => {
      const prioridadeOrder = { alta: 3, media: 2, baixa: 1 };
      return prioridadeOrder[b.prioridade] - prioridadeOrder[a.prioridade];
    });

  const aplicarSugestao = (clienteId: string) => {
    setSugestoesAplicadas(prev => new Set([...prev, clienteId]));
    // Aqui você poderia implementar a lógica para aplicar a sugestão no sistema
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const variants = {
      alta: 'bg-red-100 text-red-800',
      media: 'bg-yellow-100 text-yellow-800',
      baixa: 'bg-green-100 text-green-800'
    };
    
    return (
      <Badge variant="secondary" className={variants[prioridade as keyof typeof variants]}>
        {prioridade}
      </Badge>
    );
  };

  const getPrioridadeIcon = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'media': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'baixa': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return null;
    }
  };

  // Estatísticas resumo
  const totalSugestoes = sugestoes.length;
  const sugestoesAlta = sugestoes.filter(s => s.prioridade === 'alta').length;
  const economiaTotal = sugestoes.reduce((sum, s) => sum + s.economia_operacional, 0);
  const impactoFaturamentoTotal = sugestoes.reduce((sum, s) => sum + s.impacto_faturamento, 0);

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Sugestões</p>
                <p className="text-2xl font-bold">{totalSugestoes}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prioridade Alta</p>
                <p className="text-2xl font-bold text-red-600">{sugestoesAlta}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Economia Operacional</p>
                <p className="text-2xl font-bold text-green-600">
                  {economiaTotal.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Impacto Faturamento</p>
                <p className="text-2xl font-bold">
                  {impactoFaturamentoTotal > 0 ? '+' : ''}{impactoFaturamentoTotal.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Otimização de Periodicidade
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
            <Select value={filtrosPrioridade} onValueChange={setFiltrosPrioridade}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="alta">🔴 Alta</SelectItem>
                <SelectItem value="media">🟡 Média</SelectItem>
                <SelectItem value="baixa">🟢 Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de sugestões */}
      <Card>
        <CardHeader>
          <CardTitle>Sugestões de Otimização</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-center">Prioridade</TableHead>
                <TableHead className="text-right">Periodicidade Atual</TableHead>
                <TableHead className="text-right">Periodicidade Sugerida</TableHead>
                <TableHead className="text-right">Giro Atual</TableHead>
                <TableHead className="text-right">Giro Projetado</TableHead>
                <TableHead className="text-right">Economia Op.</TableHead>
                <TableHead className="text-right">Impacto Faturamento</TableHead>
                <TableHead>Justificativa</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sugestoes.map((sugestao) => (
                <TableRow key={sugestao.cliente_id}>
                  <TableCell className="font-medium">{sugestao.cliente_nome}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getPrioridadeIcon(sugestao.prioridade)}
                      {getPrioridadeBadge(sugestao.prioridade)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {sugestao.periodicidade_atual} dias
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {sugestao.periodicidade_sugerida} dias
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {sugestao.giro_atual.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {sugestao.giro_projetado.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        {sugestao.economia_operacional > 0 ? '+' : ''}{sugestao.economia_operacional.toFixed(1)}%
                      </span>
                      <Progress value={Math.abs(sugestao.economia_operacional)} className="w-16 h-2" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={sugestao.impacto_faturamento > 0 ? 'text-green-600' : 'text-red-600'}>
                      {sugestao.impacto_faturamento > 0 ? '+' : ''}{sugestao.impacto_faturamento.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="text-sm text-muted-foreground truncate" title={sugestao.justificativa}>
                      {sugestao.justificativa}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant={sugestoesAplicadas.has(sugestao.cliente_id) ? "secondary" : "default"}
                      disabled={sugestoesAplicadas.has(sugestao.cliente_id)}
                      onClick={() => aplicarSugestao(sugestao.cliente_id)}
                    >
                      {sugestoesAplicadas.has(sugestao.cliente_id) ? 'Aplicado' : 'Aplicar'}
                    </Button>
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
