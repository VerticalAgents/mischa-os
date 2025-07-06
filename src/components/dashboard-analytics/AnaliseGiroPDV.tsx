
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, TrendingUp, DollarSign, Users, Package, Check, X, Edit } from 'lucide-react';
import { useFaturamentoPrevisto } from '@/hooks/useFaturamentoPrevisto';
import { Cliente } from '@/types';
import { DREData } from '@/types/projections';
import { useToast } from '@/hooks/use-toast';

interface AnaliseGiroPDVProps {
  clientes: Cliente[];
  baseDRE: DREData | null;
}

interface EditingItem {
  clienteId: string;
  categoriaId: number;
  giroSemanal: number;
}

export default function AnaliseGiroPDV({ clientes, baseDRE }: AnaliseGiroPDVProps) {
  const { 
    faturamentoSemanal, 
    faturamentoMensal, 
    isLoading, 
    disponivel, 
    precosDetalhados,
    recalcular 
  } = useFaturamentoPrevisto();

  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const stats = {
    totalClientes: [...new Set(precosDetalhados.map(p => p.clienteId))].length,
    totalCategorias: [...new Set(precosDetalhados.map(p => p.categoriaId))].length,
    precosPersonalizados: precosDetalhados.filter(p => p.precoPersonalizado).length,
    totalGiroSemanal: precosDetalhados.reduce((sum, p) => sum + p.giroSemanal, 0)
  };

  const iniciarEdicao = (clienteId: string, categoriaId: number, giroAtual: number) => {
    setEditingItem({ clienteId, categoriaId, giroSemanal: giroAtual });
    setEditValue(giroAtual.toString());
  };

  const cancelarEdicao = () => {
    setEditingItem(null);
    setEditValue('');
  };

  const salvarEdicao = async () => {
    if (!editingItem) return;

    const novoGiro = parseInt(editValue);
    if (isNaN(novoGiro) || novoGiro < 0) {
      toast({
        title: "Valor inválido",
        description: "O giro semanal deve ser um número válido maior ou igual a zero",
        variant: "destructive"
      });
      return;
    }

    try {
      // Aqui você pode adicionar a lógica para salvar no banco de dados se necessário
      // Por enquanto, vamos apenas mostrar uma confirmação
      const categoriaAtual = precosDetalhados.find(
        p => p.clienteId === editingItem.clienteId && p.categoriaId === editingItem.categoriaId
      );
      
      toast({
        title: "Giro atualizado",
        description: `Giro semanal da categoria "${categoriaAtual?.categoriaNome}" atualizado para ${novoGiro} unidades`,
      });

      setEditingItem(null);
      setEditValue('');
      
      // Recalcular as projeções após a edição
      recalcular();
    } catch (error) {
      console.error('Erro ao salvar giro semanal:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o novo giro semanal",
        variant: "destructive"
      });
    }
  };

  const isEditing = (clienteId: string, categoriaId: number): boolean => {
    return editingItem?.clienteId === clienteId && editingItem?.categoriaId === categoriaId;
  };

  if (!disponivel && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Projeção Detalhada por Cliente
          </CardTitle>
          <CardDescription>
            Análise detalhada do giro médio por PDV com preços personalizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum dado disponível para análise.</p>
            <p className="text-sm mt-1">Configure clientes ativos com categorias habilitadas primeiro.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Semanal</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoading ? '...' : formatarMoeda(faturamentoSemanal)}
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
                <p className="text-sm text-muted-foreground">Faturamento Mensal</p>
                <p className="text-2xl font-bold text-blue-600">
                  {isLoading ? '...' : formatarMoeda(faturamentoMensal)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                <p className="text-2xl font-bold">{stats.totalClientes}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Preços Personalizados</p>
                <p className="text-2xl font-bold text-orange-600">{stats.precosPersonalizados}</p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Projeção Detalhada por Cliente
              </CardTitle>
              <CardDescription>
                Análise detalhada com preços personalizados por cliente e categoria
                <br />
                <span className="text-xs text-blue-600 font-medium">
                  ✏️ Giro semanal editável para todas as categorias - clique no ícone de edição
                </span>
              </CardDescription>
            </div>
            <Button
              onClick={recalcular}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Carregando...' : 'Atualizar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando projeções detalhadas...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Preço Unitário</TableHead>
                    <TableHead className="text-right">Giro Semanal (un)</TableHead>
                    <TableHead className="text-right">Faturamento Semanal</TableHead>
                    <TableHead className="text-right">Faturamento Mensal</TableHead>
                    <TableHead className="text-center">Tipo Preço</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {precosDetalhados.length > 0 ? (
                    precosDetalhados.map((item, index) => (
                      <TableRow key={`${item.clienteId}-${item.categoriaId}-${index}`}>
                        <TableCell className="font-medium">{item.clienteNome}</TableCell>
                        <TableCell>{item.categoriaNome}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatarMoeda(item.precoUnitario)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isEditing(item.clienteId, item.categoriaId) ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-20 h-8 text-xs text-right"
                                  min="0"
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={salvarEdicao}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={cancelarEdicao}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono">{item.giroSemanal}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  onClick={() => iniciarEdicao(item.clienteId, item.categoriaId, item.giroSemanal)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatarMoeda(item.faturamentoSemanal)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatarMoeda(item.faturamentoSemanal * 4)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={item.precoPersonalizado ? "default" : "secondary"}
                            className={item.precoPersonalizado ? "bg-orange-100 text-orange-800" : ""}
                          >
                            {item.precoPersonalizado ? "Personalizado" : "Padrão"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Package className="h-8 w-8" />
                          <p>Nenhum dado disponível</p>
                          <p className="text-sm">Configure clientes e categorias primeiro</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Resumo da Tabela */}
          {precosDetalhados.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex flex-wrap gap-4 text-sm">
                <span><strong>Total de registros:</strong> {precosDetalhados.length}</span>
                <span><strong>Clientes únicos:</strong> {stats.totalClientes}</span>
                <span><strong>Preços personalizados:</strong> {stats.precosPersonalizados}</span>
                <span><strong>Giro semanal total:</strong> {stats.totalGiroSemanal} unidades</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
