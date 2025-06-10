
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Download, FileText, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";

interface AuditoriaItem {
  clienteNome: string;
  statusAgendamento: string;
  dataReposicao: Date;
  statusCliente: string;
  quantidadesPorProduto: Record<string, number>;
}

export default function AuditoriaPCPTab() {
  const [filtroCliente, setFiltroCliente] = useState("");
  const [dataInicio, setDataInicio] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [dadosAuditoria, setDadosAuditoria] = useState<AuditoriaItem[]>([]);
  const [produtosAtivos, setProdutosAtivos] = useState<string[]>([]);

  const { agendamentos, carregarTodosAgendamentos } = useAgendamentoClienteStore();
  const { produtos } = useSupabaseProdutos();

  // Carregar dados iniciais
  useEffect(() => {
    carregarTodosAgendamentos();
  }, [carregarTodosAgendamentos]);

  // Atualizar lista de produtos ativos
  useEffect(() => {
    const produtosAtivosLista = produtos
      .filter(produto => produto.ativo)
      .map(produto => produto.nome)
      .sort();
    setProdutosAtivos(produtosAtivosLista);
  }, [produtos]);

  // Processar dados de auditoria
  useEffect(() => {
    processarDadosAuditoria();
  }, [agendamentos, produtos, dataInicio, dataFim, filtroCliente, filtroStatus]);

  const processarDadosAuditoria = () => {
    console.log('🔍 Processando dados de auditoria...');
    console.log('📊 Total de agendamentos:', agendamentos.length);
    console.log('🏭 Produtos ativos:', produtos.filter(p => p.ativo).length);

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    // Filtrar agendamentos
    const agendamentosFiltrados = agendamentos.filter(agendamento => {
      const dataReposicao = new Date(agendamento.dataReposicao);
      
      // Filtro por período
      const dentroPeríodo = dataReposicao >= inicio && dataReposicao <= fim;
      
      // Filtro por cliente
      const clienteMatch = !filtroCliente || 
        agendamento.cliente.nome.toLowerCase().includes(filtroCliente.toLowerCase());
      
      // Filtro por status
      const statusMatch = filtroStatus === 'todos' || 
        agendamento.statusAgendamento === filtroStatus;
      
      return dentroPeríodo && clienteMatch && statusMatch;
    });

    console.log('📋 Agendamentos filtrados:', agendamentosFiltrados.length);

    // Processar cada agendamento
    const dadosProcessados: AuditoriaItem[] = agendamentosFiltrados.map(agendamento => {
      const quantidadesPorProduto: Record<string, number> = {};
      
      // Inicializar todas as quantidades como 0
      produtosAtivos.forEach(nomeProduto => {
        quantidadesPorProduto[nomeProduto] = 0;
      });

      console.log(`\n📦 Processando agendamento: ${agendamento.cliente.nome}`);
      console.log('🔍 Tipo de pedido:', agendamento.pedido?.tipoPedido || 'Padrão');

      // Verificar se há pedido com itens específicos (tipo Alterado)
      if (agendamento.pedido && 
          agendamento.pedido.tipoPedido === 'Alterado' && 
          agendamento.pedido.itensPedido && 
          agendamento.pedido.itensPedido.length > 0) {
        
        console.log('📝 Processando pedido ALTERADO com itens:', agendamento.pedido.itensPedido);
        
        // Para pedidos alterados, usar quantidades específicas dos itens
        agendamento.pedido.itensPedido.forEach(item => {
          const nomeProduto = item.nomeSabor || (item.sabor && item.sabor.nome);
          const quantidade = item.quantidadeSabor || 0;
          
          if (nomeProduto && quantidade > 0) {
            if (quantidadesPorProduto.hasOwnProperty(nomeProduto)) {
              quantidadesPorProduto[nomeProduto] = quantidade;
              console.log(`➕ ${nomeProduto}: ${quantidade} unidades (pedido alterado)`);
            } else {
              console.warn(`⚠️ Produto não encontrado nos ativos: ${nomeProduto}`);
            }
          }
        });
      } else {
        // Para agendamentos padrão, usar a quantidade total
        // Distribuir para o primeiro produto ativo (temporariamente)
        const quantidadeTotal = agendamento.cliente.quantidadePadrao || 0;
        console.log(`📊 Processando agendamento PADRÃO com quantidade total: ${quantidadeTotal}`);
        
        if (quantidadeTotal > 0 && produtosAtivos.length > 0) {
          // Distribuir toda a quantidade para o primeiro produto ativo
          // Em um cenário real, isso deveria usar proporções padrão configuradas
          const primeiroProduto = produtosAtivos[0];
          quantidadesPorProduto[primeiroProduto] = quantidadeTotal;
          console.log(`➕ ${primeiroProduto}: ${quantidadeTotal} unidades (agendamento padrão)`);
        }
      }

      return {
        clienteNome: agendamento.cliente.nome,
        statusAgendamento: agendamento.statusAgendamento,
        dataReposicao: agendamento.dataReposicao,
        statusCliente: agendamento.cliente.statusCliente || 'Ativo',
        quantidadesPorProduto
      };
    });

    console.log('✅ Dados de auditoria processados:', dadosProcessados.length);
    setDadosAuditoria(dadosProcessados);
  };

  const exportarCSV = () => {
    console.log('📥 Iniciando exportação CSV...');
    
    // Cabeçalhos
    const headers = [
      'Cliente',
      'Status Agendamento',
      'Data Reposição',
      'Status Cliente',
      ...produtosAtivos
    ];

    // Linhas de dados
    const linhas = dadosAuditoria.map(item => [
      item.clienteNome,
      item.statusAgendamento,
      format(item.dataReposicao, 'dd/MM/yyyy'),
      item.statusCliente,
      ...produtosAtivos.map(produto => item.quantidadesPorProduto[produto] || 0)
    ]);

    // Criar conteúdo CSV
    const csvContent = [
      headers.join(','),
      ...linhas.map(linha => linha.join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria-pcp-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    console.log('✅ Exportação CSV concluída');
  };

  const limparFiltros = () => {
    setFiltroCliente("");
    setFiltroStatus('todos');
    setDataInicio(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
    setDataFim(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Auditoria PCP
          </CardTitle>
          <CardDescription>
            Visualização detalhada de todos os agendamentos e quantidades reais de produtos para auditoria e validação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="filtro-cliente">Buscar Cliente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="filtro-cliente"
                  placeholder="Nome do cliente..."
                  value={filtroCliente}
                  onChange={(e) => setFiltroCliente(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="min-w-[150px]">
              <Label htmlFor="data-inicio">Data Início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            
            <div className="min-w-[150px]">
              <Label htmlFor="data-fim">Data Fim</Label>
              <Input
                id="data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            
            <div className="min-w-[150px]">
              <Label htmlFor="filtro-status">Status</Label>
              <select
                id="filtro-status"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="todos">Todos</option>
                <option value="Agendado">Agendado</option>
                <option value="Previsto">Previsto</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={limparFiltros}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Limpar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportarCSV}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>

          {/* Indicadores */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {dadosAuditoria.length} agendamentos encontrados
            </Badge>
            <Badge variant="outline">
              {produtosAtivos.length} produtos ativos
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Auditoria */}
      <Card>
        <CardHeader>
          <CardTitle>Dados de Auditoria</CardTitle>
        </CardHeader>
        <CardContent>
          {dadosAuditoria.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhum agendamento encontrado com os filtros aplicados.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Cliente</TableHead>
                    <TableHead>Status Agendamento</TableHead>
                    <TableHead>Data Reposição</TableHead>
                    <TableHead>Status Cliente</TableHead>
                    {produtosAtivos.map(produto => (
                      <TableHead key={produto} className="text-center min-w-[120px]">
                        {produto}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosAuditoria.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.clienteNome}</TableCell>
                      <TableCell>
                        <Badge variant={item.statusAgendamento === 'Agendado' ? 'default' : 'secondary'}>
                          {item.statusAgendamento}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(item.dataReposicao, "dd 'de' MMMM", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.statusCliente === 'Ativo' ? 'default' : 'outline'}>
                          {item.statusCliente}
                        </Badge>
                      </TableCell>
                      {produtosAtivos.map(produto => (
                        <TableCell key={produto} className="text-center">
                          <span className={
                            item.quantidadesPorProduto[produto] > 0 
                              ? 'font-semibold text-green-600' 
                              : 'text-muted-foreground'
                          }>
                            {item.quantidadesPorProduto[produto] || 0}
                          </span>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
