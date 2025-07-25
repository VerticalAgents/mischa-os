
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Eye } from "lucide-react";
import { useHistoricoEntregasStore } from "@/hooks/useHistoricoEntregasStore";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useSupabasePrecosCategoriaCliente } from "@/hooks/useSupabasePrecosCategoriaCliente";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EntregaAuditoria {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  data: Date;
  quantidade: number;
  itens: any[];
  tipo: 'entrega' | 'retorno';
  faturamento: number;
  observacao?: string;
}

interface AuditoriaEntregasProps {
  dataInicio: string;
  dataFim: string;
}

export default function AuditoriaEntregas({ dataInicio, dataFim }: AuditoriaEntregasProps) {
  const [entregas, setEntregas] = useState<EntregaAuditoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroCliente, setFiltroCliente] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { carregarHistorico, registros } = useHistoricoEntregasStore();
  const { clientes } = useClienteStore();
  const { carregarPrecosPorCliente } = useSupabasePrecosCategoriaCliente();

  // Função para calcular faturamento de uma entrega
  const calcularFaturamento = async (entrega: any) => {
    if (entrega.tipo === 'retorno') return 0;
    
    try {
      const precos = await carregarPrecosPorCliente(entrega.cliente_id);
      let faturamentoTotal = 0;
      
      if (entrega.itens && entrega.itens.length > 0) {
        // Calcular baseado nos itens personalizados
        entrega.itens.forEach((item: any) => {
          const precoItem = precos.find(p => p.categoria_id === item.categoria_id);
          if (precoItem) {
            faturamentoTotal += item.quantidade * precoItem.preco_unitario;
          }
        });
      } else {
        // Calcular baseado na quantidade padrão
        const cliente = clientes.find(c => c.id === entrega.cliente_id);
        if (cliente && cliente.categoriasHabilitadas) {
          const categorias = Array.isArray(cliente.categoriasHabilitadas) 
            ? cliente.categoriasHabilitadas 
            : [];
          
          categorias.forEach((categoria: any) => {
            const precoCategoria = precos.find(p => p.categoria_id === categoria.id);
            if (precoCategoria) {
              const quantidadeCategoria = Math.floor(entrega.quantidade / categorias.length);
              faturamentoTotal += quantidadeCategoria * precoCategoria.preco_unitario;
            }
          });
        }
      }
      
      return faturamentoTotal;
    } catch (error) {
      console.error('Erro ao calcular faturamento:', error);
      return 0;
    }
  };

  // Carregar dados quando período muda
  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        await carregarHistorico();
        
        // Verificar se registros existe e não está vazio
        if (!registros || registros.length === 0) {
          console.log('Nenhum registro encontrado');
          setEntregas([]);
          setLoading(false);
          return;
        }
        
        // Filtrar por período
        const dataInicioDate = new Date(dataInicio);
        const dataFimDate = new Date(dataFim);
        
        const entregasFiltradas = registros.filter(h => {
          const dataEntrega = new Date(h.data);
          return dataEntrega >= dataInicioDate && dataEntrega <= dataFimDate;
        });
        
        // Calcular faturamento para cada entrega
        const entregasComFaturamento = await Promise.all(
          entregasFiltradas.map(async (entrega) => {
            const faturamento = await calcularFaturamento(entrega);
            return {
              id: entrega.id,
              cliente_id: entrega.cliente_id,
              cliente_nome: entrega.cliente_nome || 'Cliente não encontrado',
              data: entrega.data,
              quantidade: entrega.quantidade,
              itens: entrega.itens,
              tipo: entrega.tipo,
              faturamento,
              observacao: entrega.observacao
            } as EntregaAuditoria;
          })
        );
        
        setEntregas(entregasComFaturamento);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    carregarDados();
  }, [dataInicio, dataFim, registros?.length || 0]);

  // Filtrar entregas por cliente
  const entregasFiltradas = entregas.filter(entrega =>
    entrega.cliente_nome.toLowerCase().includes(filtroCliente.toLowerCase())
  );

  const toggleExpandRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const exportarCSV = () => {
    const csvContent = [
      ['Data', 'Cliente', 'Tipo', 'Quantidade', 'Faturamento', 'Observação'],
      ...entregasFiltradas.map(entrega => [
        format(new Date(entrega.data), 'dd/MM/yyyy', { locale: ptBR }),
        entrega.cliente_nome,
        entrega.tipo === 'entrega' ? 'Entrega' : 'Retorno',
        entrega.quantidade.toString(),
        `R$ ${entrega.faturamento.toFixed(2).replace('.', ',')}`,
        entrega.observacao || ''
      ])
    ].map(row => row.join(';')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `auditoria_entregas_${dataInicio}_${dataFim}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Auditoria de Entregas</CardTitle>
            <CardDescription>
              Detalhamento completo das entregas com faturamento calculado
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por cliente..."
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" onClick={exportarCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Carregando dados...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entregasFiltradas.map((entrega) => (
                <>
                  <TableRow key={entrega.id}>
                    <TableCell>
                      {format(new Date(entrega.data), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {entrega.cliente_nome}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entrega.tipo === 'entrega' ? 'default' : 'secondary'}>
                        {entrega.tipo === 'entrega' ? 'Entrega' : 'Retorno'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {entrega.quantidade}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {entrega.faturamento.toFixed(2).replace('.', ',')}
                    </TableCell>
                    <TableCell>
                      {entrega.observacao || '-'}
                    </TableCell>
                    <TableCell>
                      {entrega.itens.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpandRow(entrega.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  
                  {expandedRows.has(entrega.id) && entrega.itens.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/50">
                        <div className="py-2">
                          <h4 className="font-medium mb-2">Itens da Entrega:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {entrega.itens.map((item: any, index: number) => (
                              <div key={index} className="text-sm">
                                {item.nome}: {item.quantidade} unidades
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
