
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Download, Database, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";

interface AgendamentoBackend {
  id: string;
  clienteNome: string;
  statusAgendamento: string;
  dataReposicao: string;
  statusCliente: string;
  produtoQuantidades: Record<string, number>;
}

export default function BackendPCPTab() {
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'agendados' | 'previstos'>('todos');
  const [dadosBackend, setDadosBackend] = useState<AgendamentoBackend[]>([]);

  const { agendamentos, carregarTodosAgendamentos } = useAgendamentoClienteStore();
  const { produtos } = useSupabaseProdutos();

  // Carregar agendamentos ao montar o componente
  useEffect(() => {
    carregarTodosAgendamentos();
  }, [carregarTodosAgendamentos]);

  // Processar dados dos agendamentos para a tabela backend
  useEffect(() => {
    console.log('🔍 Backend PCP: Processando agendamentos...');
    console.log('📦 Total de agendamentos:', agendamentos.length);
    console.log('🏭 Produtos ativos:', produtos.filter(p => p.ativo).length);

    const produtosAtivos = produtos.filter(p => p.ativo);

    const dadosProcessados: AgendamentoBackend[] = agendamentos.map(agendamento => {
      const produtoQuantidades: Record<string, number> = {};

      // Inicializar todas as quantidades com zero
      produtosAtivos.forEach(produto => {
        produtoQuantidades[produto.nome] = 0;
      });

      console.log(`\n📋 Processando agendamento ${agendamento.cliente.nome}:`);
      console.log('- Status agendamento:', agendamento.statusAgendamento);
      console.log('- Data reposição:', agendamento.dataReposicao);
      console.log('- Pedido:', agendamento.pedido);

      // Se há pedido com itens específicos (tipo Alterado)
      if (agendamento.pedido && agendamento.pedido.tipoPedido === 'Alterado' && agendamento.pedido.itensPedido && agendamento.pedido.itensPedido.length > 0) {
        console.log('📝 Pedido ALTERADO com itens específicos:', agendamento.pedido.itensPedido);
        
        agendamento.pedido.itensPedido.forEach(item => {
          const produto = produtos.find(p => 
            p.nome === item.nomeSabor || 
            p.nome.toLowerCase().includes(item.nomeSabor?.toLowerCase() || '') ||
            (item.sabor && p.nome === item.sabor.nome)
          );
          
          if (produto) {
            const quantidade = item.quantidadeSabor || 0;
            produtoQuantidades[produto.nome] = quantidade;
            console.log(`➕ ${produto.nome}: ${quantidade} unidades`);
          } else {
            console.warn(`⚠️ Produto não encontrado para item: ${item.nomeSabor}`);
          }
        });
      } else {
        // Para agendamentos padrão, usar quantidade total distribuída
        const quantidadeTotal = agendamento.cliente.quantidadePadrao || 0;
        console.log(`📊 Agendamento PADRÃO com quantidade total: ${quantidadeTotal}`);
        
        if (quantidadeTotal > 0) {
          // Distribuir para o primeiro produto ativo (simplificação para visualização)
          const produtoAtivo = produtosAtivos[0];
          if (produtoAtivo) {
            produtoQuantidades[produtoAtivo.nome] = quantidadeTotal;
            console.log(`➕ ${produtoAtivo.nome}: ${quantidadeTotal} unidades (padrão)`);
          }
        }
      }

      return {
        id: agendamento.cliente.id,
        clienteNome: agendamento.cliente.nome,
        statusAgendamento: agendamento.statusAgendamento,
        dataReposicao: format(agendamento.dataReposicao, 'dd/MM/yyyy'),
        statusCliente: agendamento.cliente.statusCliente,
        produtoQuantidades
      };
    });

    console.log('✅ Dados processados para Backend PCP:', dadosProcessados.length);
    setDadosBackend(dadosProcessados);
  }, [agendamentos, produtos]);

  // Filtrar dados conforme critérios
  const dadosFiltrados = dadosBackend.filter(item => {
    // Filtro por nome do cliente
    const filtroClienteOk = !filtroCliente || 
      item.clienteNome.toLowerCase().includes(filtroCliente.toLowerCase());

    // Filtro por status do agendamento
    const filtroStatusOk = filtroStatus === 'todos' ||
      (filtroStatus === 'agendados' && item.statusAgendamento === 'Agendado') ||
      (filtroStatus === 'previstos' && item.statusAgendamento === 'Previsto');

    // Filtro por período (se especificado)
    let filtroPeriodoOk = true;
    if (filtroDataInicio || filtroDataFim) {
      const dataItem = new Date(item.dataReposicao.split('/').reverse().join('-'));
      
      if (filtroDataInicio) {
        const dataInicio = new Date(filtroDataInicio);
        filtroPeriodoOk = filtroPeriodoOk && dataItem >= dataInicio;
      }
      
      if (filtroDataFim) {
        const dataFim = new Date(filtroDataFim);
        filtroPeriodoOk = filtroPeriodoOk && dataItem <= dataFim;
      }
    }

    return filtroClienteOk && filtroStatusOk && filtroPeriodoOk;
  });

  // Exportar dados para CSV
  const exportarCSV = () => {
    const produtosAtivos = produtos.filter(p => p.ativo);
    
    const headers = [
      'Cliente',
      'Status Agendamento',
      'Data Reposição',
      'Status Cliente',
      ...produtosAtivos.map(p => p.nome)
    ];

    const csvContent = [
      headers.join(','),
      ...dadosFiltrados.map(item => [
        `"${item.clienteNome}"`,
        item.statusAgendamento,
        item.dataReposicao,
        item.statusCliente,
        ...produtosAtivos.map(p => item.produtoQuantidades[p.nome] || 0)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backend-pcp-agendamentos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const produtosAtivos = produtos.filter(p => p.ativo);

  return (
    <div className="space-y-6">
      {/* Controles de filtro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backend PCP - Dados Brutos dos Agendamentos
          </CardTitle>
          <CardDescription>
            Visualização completa dos agendamentos e quantidades de produtos para validação da projeção de produção
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="filtro-cliente">Cliente</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="filtro-cliente"
                  placeholder="Buscar cliente..."
                  value={filtroCliente}
                  onChange={(e) => setFiltroCliente(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="filtro-data-inicio">Data Início</Label>
              <Input
                id="filtro-data-inicio"
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="filtro-data-fim">Data Fim</Label>
              <Input
                id="filtro-data-fim"
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
              />
            </div>

            <div>
              <Label>Status Agendamento</Label>
              <div className="flex gap-1 pt-1">
                <Button
                  variant={filtroStatus === 'todos' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroStatus('todos')}
                >
                  Todos
                </Button>
                <Button
                  variant={filtroStatus === 'agendados' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroStatus('agendados')}
                >
                  Agendados
                </Button>
                <Button
                  variant={filtroStatus === 'previstos' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroStatus('previstos')}
                >
                  Previstos
                </Button>
              </div>
            </div>

            <div className="flex items-end">
              <Button
                onClick={exportarCSV}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Total de agendamentos: {dadosBackend.length}</span>
            <span>Filtrados: {dadosFiltrados.length}</span>
            <span>Produtos ativos: {produtosAtivos.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de dados */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Brutos - Agendamentos e Quantidades</CardTitle>
          <CardDescription>
            Tabela completa com quantidades reais de produtos por agendamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Cliente</TableHead>
                  <TableHead>Status Agendamento</TableHead>
                  <TableHead>Data Reposição</TableHead>
                  <TableHead>Status Cliente</TableHead>
                  {produtosAtivos.map(produto => (
                    <TableHead key={produto.id} className="text-right min-w-[100px]">
                      {produto.nome}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosFiltrados.length > 0 ? (
                  dadosFiltrados.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.clienteNome}</TableCell>
                      <TableCell>
                        <Badge variant={item.statusAgendamento === 'Agendado' ? 'default' : 'secondary'}>
                          {item.statusAgendamento}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.dataReposicao}</TableCell>
                      <TableCell>
                        <Badge variant={item.statusCliente === 'Ativo' ? 'default' : 'outline'}>
                          {item.statusCliente}
                        </Badge>
                      </TableCell>
                      {produtosAtivos.map(produto => (
                        <TableCell key={produto.id} className="text-right">
                          <span className={item.produtoQuantidades[produto.nome] > 0 ? 'font-medium' : 'text-muted-foreground'}>
                            {item.produtoQuantidades[produto.nome] || 0}
                          </span>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4 + produtosAtivos.length} className="text-center py-6">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        Nenhum agendamento encontrado com os filtros aplicados
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Resumo por produto */}
          {dadosFiltrados.length > 0 && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Resumo das Quantidades (dados filtrados):</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {produtosAtivos.map(produto => {
                  const total = dadosFiltrados.reduce((sum, item) => 
                    sum + (item.produtoQuantidades[produto.nome] || 0), 0
                  );
                  return total > 0 ? (
                    <div key={produto.id} className="flex justify-between">
                      <span>{produto.nome}:</span>
                      <span className="font-medium">{total} unidades</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
