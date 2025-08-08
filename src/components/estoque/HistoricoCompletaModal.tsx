
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Calendar, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MovimentacaoEstoqueProduto, MovimentacaoEstoqueInsumo, MovTipo, asMovTipo } from "@/types/estoque";

interface HistoricoCompletaModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemNome: string;
  tipoItem: 'produto' | 'insumo';
}

const getTipoBadgeVariant = (tipo: MovTipo) => {
  switch (tipo) {
    case 'entrada': return 'default';
    case 'saida': return 'destructive';
    case 'ajuste': return 'secondary';
    default: return 'outline';
  }
};

const getTipoLabel = (tipo: MovTipo) => {
  switch (tipo) {
    case 'entrada': return 'Entrada';
    case 'saida': return 'Saída';
    case 'ajuste': return 'Ajuste';
    default: return tipo;
  }
};

export function HistoricoCompletaModal({
  isOpen,
  onClose,
  itemId,
  itemNome,
  tipoItem
}: HistoricoCompletaModalProps) {
  const [movimentacoes, setMovimentacoes] = useState<(MovimentacaoEstoqueProduto | MovimentacaoEstoqueInsumo)[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    dataInicial: '',
    dataFinal: '',
    tipo: ''
  });

  const carregarMovimentacoes = async () => {
    setLoading(true);
    try {
      const tabela = tipoItem === 'produto' 
        ? 'movimentacoes_estoque_produtos' 
        : 'movimentacoes_estoque_insumos';
      
      const coluna = tipoItem === 'produto' ? 'produto_id' : 'insumo_id';
      
      let query = supabase
        .from(tabela)
        .select('*')
        .eq(coluna, itemId)
        .order('data_movimentacao', { ascending: false })
        .order('created_at', { ascending: false });

      if (filtros.dataInicial) {
        query = query.gte('data_movimentacao', filtros.dataInicial);
      }
      
      if (filtros.dataFinal) {
        query = query.lte('data_movimentacao', filtros.dataFinal + 'T23:59:59');
      }
      
      if (filtros.tipo) {
        query = query.eq('tipo', filtros.tipo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar histórico completo:', error);
        toast({
          title: "Erro ao carregar histórico",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      const movimentacoesNormalizadas = (data || []).map(item => ({
        ...item,
        tipo: asMovTipo(item.tipo)
      }));
      
      setMovimentacoes(movimentacoesNormalizadas);
    } catch (error) {
      console.error('Erro ao carregar histórico completo:', error);
      toast({
        title: "Erro ao carregar histórico",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = () => {
    if (movimentacoes.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há movimentações para exportar",
        variant: "destructive"
      });
      return;
    }

    const headers = ['Data', 'Tipo', 'Quantidade', 'Observação'];
    const csvContent = [
      headers.join(','),
      ...movimentacoes.map(mov => [
        format(new Date(mov.data_movimentacao), "dd/MM/yyyy HH:mm"),
        getTipoLabel(mov.tipo),
        mov.quantidade.toFixed(3).replace('.', ','),
        `"${mov.observacao || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `historico_${itemNome}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Exportação concluída",
      description: `Histórico de ${itemNome} exportado com sucesso`,
    });
  };

  useEffect(() => {
    if (isOpen) {
      carregarMovimentacoes();
    }
  }, [isOpen, itemId, filtros]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Histórico Completo - {itemNome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={filtros.dataInicial}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicial: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={filtros.dataFinal}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataFinal: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={filtros.tipo} onValueChange={(value) => setFiltros(prev => ({ ...prev, tipo: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="ajuste">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiltros({ dataInicial: '', dataFinal: '', tipo: '' })}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Limpar
              </Button>
              <Button
                onClick={exportarCSV}
                size="sm"
                className="flex items-center gap-2"
                disabled={movimentacoes.length === 0}
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-auto max-h-[400px]">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-muted-foreground">Carregando...</div>
              </div>
            ) : movimentacoes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma movimentação encontrada com os filtros aplicados
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentacoes.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell>
                        {format(new Date(mov.data_movimentacao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTipoBadgeVariant(mov.tipo)}>
                          {getTipoLabel(mov.tipo)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {mov.quantidade.toFixed(3)}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {mov.observacao || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="text-sm text-muted-foreground text-center">
            Total de registros: {movimentacoes.length}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
