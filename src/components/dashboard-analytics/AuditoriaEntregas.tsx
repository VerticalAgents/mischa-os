
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
import { useProdutoStore } from "@/hooks/useProdutoStore";
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
  precosPraticados: { [key: string]: number };
  ticketEntrega: number;
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
  const { produtos } = useProdutoStore();

  // Função para buscar preços praticados pelo cliente
  const obterPrecosPraticados = async (clienteId: string) => {
    try {
      const precos = await carregarPrecosPorCliente(clienteId);
      const precosMap: { [key: string]: number } = {};
      
      precos.forEach(preco => {
        const categoriaKey = String(preco.categoria_id);
        precosMap[categoriaKey] = preco.preco_unitario;
      });
      
      return precosMap;
    } catch (error) {
      console.error('Erro ao carregar preços do cliente:', error);
      return {};
    }
  };

  // Função para calcular faturamento detalhado de uma entrega
  const calcularFaturamentoDetalhado = async (entrega: any) => {
    if (entrega.tipo === 'retorno') return { faturamento: 0, precosPraticados: {}, ticketEntrega: 0 };
    
    try {
      const precosPraticados = await obterPrecosPraticados(entrega.cliente_id);
      let faturamentoTotal = 0;
      
      if (entrega.itens && entrega.itens.length > 0) {
        // Calcular baseado nos itens específicos da entrega
        entrega.itens.forEach((item: any) => {
          const categoriaKey = String(item.categoria_id);
          const precoItem = precosPraticados[categoriaKey];
          if (precoItem && item.quantidade) {
            faturamentoTotal += Number(item.quantidade) * precoItem;
          }
        });
      } else {
        // Calcular baseado na quantidade total e categorias habilitadas do cliente
        const cliente = clientes.find(c => c.id === entrega.cliente_id);
        if (cliente?.categoriasHabilitadas && Array.isArray(cliente.categoriasHabilitadas)) {
          const totalCategorias = cliente.categoriasHabilitadas.length;
          const quantidadePorCategoria = entrega.quantidade / totalCategorias;
          
          cliente.categoriasHabilitadas.forEach((categoria: any) => {
            const categoriaKey = String(categoria.id);
            const precoCategoria = precosPraticados[categoriaKey];
            if (precoCategoria) {
              faturamentoTotal += quantidadePorCategoria * precoCategoria;
            }
          });
        }
      }
      
      return {
        faturamento: faturamentoTotal,
        precosPraticados,
        ticketEntrega: faturamentoTotal
      };
    } catch (error) {
      console.error('Erro ao calcular faturamento:', error);
      return { faturamento: 0, precosPraticados: {}, ticketEntrega: 0 };
    }
  };

  // Função para obter nome do produto por ID
  const obterNomeProduto = (produtoId: string) => {
    const produto = produtos.find(p => p.id === produtoId);
    return produto?.nome || `Produto ${produtoId}`;
  };

  // Função para obter nome da categoria por ID
  const obterNomeCategoria = (categoriaId: string | number) => {
    // Implementar lógica para obter nome da categoria
    return `Categoria ${categoriaId}`;
  };

  // Carregar dados quando período muda
  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        await carregarHistorico();
        
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
        
        // Calcular faturamento detalhado para cada entrega
        const entregasComDetalhes = await Promise.all(
          entregasFiltradas.map(async (entrega) => {
            const { faturamento, precosPraticados, ticketEntrega } = await calcularFaturamentoDetalhado(entrega);
            
            return {
              id: entrega.id,
              cliente_id: entrega.cliente_id,
              cliente_nome: entrega.cliente_nome || 'Cliente não encontrado',
              data: entrega.data,
              quantidade: entrega.quantidade,
              itens: entrega.itens,
              tipo: entrega.tipo,
              faturamento,
              precosPraticados,
              ticketEntrega,
              observacao: entrega.observacao
            } as EntregaAuditoria;
          })
        );
        
        setEntregas(entregasComDetalhes);
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

  // Calcular indicadores
  const indicadores = {
    totalEntregas: entregasFiltradas.filter(e => e.tipo === 'entrega').length,
    totalRetornos: entregasFiltradas.filter(e => e.tipo === 'retorno').length,
    faturamentoTotal: entregasFiltradas
      .filter(e => e.tipo === 'entrega')
      .reduce((sum, e) => sum + e.faturamento, 0),
    clientesAtendidos: new Set(entregasFiltradas.map(e => e.cliente_id)).size,
    ticketMedio: entregasFiltradas.filter(e => e.tipo === 'entrega').length > 0 
      ? entregasFiltradas
          .filter(e => e.tipo === 'entrega')
          .reduce((sum, e) => sum + e.ticketEntrega, 0) / 
        entregasFiltradas.filter(e => e.tipo === 'entrega').length
      : 0
  };

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
      ['Data', 'Cliente', 'Tipo', 'Quantidade', 'Faturamento', 'Ticket', 'Observação'],
      ...entregasFiltradas.map(entrega => [
        format(new Date(entrega.data), 'dd/MM/yyyy', { locale: ptBR }),
        entrega.cliente_nome,
        entrega.tipo === 'entrega' ? 'Entrega' : 'Retorno',
        entrega.quantidade.toString(),
        `R$ ${entrega.faturamento.toFixed(2).replace('.', ',')}`,
        `R$ ${entrega.ticketEntrega.toFixed(2).replace('.', ',')}`,
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
    <div className="space-y-6">
      {/* Indicadores principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Entregas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.totalEntregas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Retornos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.totalRetornos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {indicadores.faturamentoTotal.toFixed(2).replace('.', ',')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clientes Atendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.clientesAtendidos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {indicadores.ticketMedio.toFixed(2).replace('.', ',')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de entregas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Auditoria de Entregas</CardTitle>
              <CardDescription>
                Detalhamento completo das entregas com preços praticados e faturamento calculado
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
                  <TableHead className="text-right">Ticket</TableHead>
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
                      <TableCell className="text-right">
                        R$ {entrega.ticketEntrega.toFixed(2).replace('.', ',')}
                      </TableCell>
                      <TableCell>
                        {entrega.observacao || '-'}
                      </TableCell>
                      <TableCell>
                        {(entrega.itens.length > 0 || Object.keys(entrega.precosPraticados).length > 0) && (
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
                    
                    {expandedRows.has(entrega.id) && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/50">
                          <div className="py-4">
                            {entrega.itens.length > 0 ? (
                              <div>
                                <h4 className="font-medium mb-2">Itens da Entrega:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {entrega.itens.map((item: any, index: number) => {
                                    const categoriaKey = String(item.categoria_id);
                                    const precoItem = entrega.precosPraticados[categoriaKey];
                                    const subtotal = precoItem ? (Number(item.quantidade) * precoItem) : 0;
                                    
                                    return (
                                      <div key={index} className="text-sm p-2 bg-background rounded border">
                                        <div className="font-medium">{obterNomeProduto(item.produto_id) || item.nome}</div>
                                        <div className="text-muted-foreground">
                                          Quantidade: {item.quantidade} unidades
                                        </div>
                                        <div className="text-muted-foreground">
                                          Categoria: {obterNomeCategoria(item.categoria_id)}
                                        </div>
                                        {precoItem && (
                                          <>
                                            <div className="text-muted-foreground">
                                              Preço unitário: R$ {precoItem.toFixed(2).replace('.', ',')}
                                            </div>
                                            <div className="font-medium text-green-600">
                                              Subtotal: R$ {subtotal.toFixed(2).replace('.', ',')}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <h4 className="font-medium mb-2">Preços Praticados:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {Object.entries(entrega.precosPraticados).map(([categoriaId, preco]) => (
                                    <div key={categoriaId} className="text-sm p-2 bg-background rounded border">
                                      <div className="font-medium">{obterNomeCategoria(categoriaId)}</div>
                                      <div className="text-muted-foreground">
                                        Preço: R$ {preco.toFixed(2).replace('.', ',')}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
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
    </div>
  );
}
