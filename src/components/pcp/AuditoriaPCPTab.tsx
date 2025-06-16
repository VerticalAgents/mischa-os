
import { useState, useEffect, useCallback } from "react";
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
import { useAuditoriaPCPData } from "@/hooks/useAuditoriaPCPData";

export default function AuditoriaPCPTab() {
  const [filtroCliente, setFiltroCliente] = useState("");
  const [dataInicio, setDataInicio] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [dadosCarregados, setDadosCarregados] = useState(false);

  const { carregarTodosAgendamentos } = useAgendamentoClienteStore();
  const { dadosAuditoria, produtosAtivos, loading, processarDadosAuditoria } = useAuditoriaPCPData();

  // Função memoizada para processar dados
  const processarDados = useCallback(() => {
    processarDadosAuditoria(dataInicio, dataFim, filtroCliente, filtroStatus);
  }, [dataInicio, dataFim, filtroCliente, filtroStatus, processarDadosAuditoria]);

  // Carregar agendamentos apenas uma vez
  useEffect(() => {
    let isMounted = true;
    
    const carregarDados = async () => {
      if (!dadosCarregados && isMounted) {
        try {
          await carregarTodosAgendamentos();
          setDadosCarregados(true);
        } catch (error) {
          console.error('Erro ao carregar agendamentos:', error);
        }
      }
    };

    carregarDados();

    return () => {
      isMounted = false;
    };
  }, [carregarTodosAgendamentos, dadosCarregados]);

  // Processar dados apenas quando os agendamentos estiverem carregados
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (dadosCarregados) {
      timeoutId = setTimeout(() => {
        processarDados();
      }, 300); // Debounce de 300ms
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [dadosCarregados, processarDados]);

  const exportarCSV = () => {
    console.log('📥 Iniciando exportação CSV...');
    
    // Cabeçalhos
    const headers = [
      'Cliente',
      'Status Agendamento',
      'Data Reposição',
      'Status Cliente',
      ...produtosAtivos.map(p => p.nome)
    ];

    // Linhas de dados
    const linhas = dadosAuditoria.map(item => [
      item.clienteNome,
      item.statusAgendamento,
      format(item.dataReposicao, 'dd/MM/yyyy'),
      item.statusCliente,
      ...produtosAtivos.map(produto => item.quantidadesPorProduto[produto.nome] || 0)
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
                disabled={loading || !dadosCarregados}
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
            {loading && (
              <Badge variant="outline" className="animate-pulse">
                Carregando...
              </Badge>
            )}
            {!dadosCarregados && (
              <Badge variant="outline" className="animate-pulse">
                Inicializando...
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Auditoria */}
      <Card>
        <CardHeader>
          <CardTitle>Dados de Auditoria</CardTitle>
        </CardHeader>
        <CardContent>
          {!dadosCarregados ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Inicializando sistema...</span>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Processando dados...</span>
            </div>
          ) : dadosAuditoria.length === 0 ? (
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
                      <TableHead key={produto.nome} className="text-center min-w-[120px]">
                        {produto.nome}
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
                        <TableCell key={produto.nome} className="text-center">
                          <span className={
                            item.quantidadesPorProduto[produto.nome] > 0 
                              ? 'font-semibold text-green-600' 
                              : 'text-muted-foreground'
                          }>
                            {item.quantidadesPorProduto[produto.nome] || 0}
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
