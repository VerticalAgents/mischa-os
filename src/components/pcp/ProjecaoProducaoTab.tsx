
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, Download, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";

interface ProjecaoItem {
  idProduto: string;
  nomeProduto: string;
  unidadesNecessarias: number;
  estoqueDisponivel: number;
  unidadesProduzir: number;
  formasNecessarias: number;
  sobraEstimada: number;
}

interface AuditoriaItem {
  clienteNome: string;
  statusAgendamento: string;
  dataReposicao: Date;
  statusCliente: string;
  quantidadesPorProduto: Record<string, number>;
}

type TipoAgendamento = 'agendados' | 'agendados-previstos';

export default function ProjecaoProducaoTab() {
  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [tipoAgendamento, setTipoAgendamento] = useState<TipoAgendamento>('agendados');
  const [projecaoItens, setProjecaoItens] = useState<ProjecaoItem[]>([]);
  const [dadosAuditoria, setDadosAuditoria] = useState<AuditoriaItem[]>([]);
  const [produtosAtivos, setProdutosAtivos] = useState<string[]>([]);
  const [temEstoqueManual, setTemEstoqueManual] = useState(false);

  const { agendamentos, carregarTodosAgendamentos } = useAgendamentoClienteStore();
  const { produtos } = useSupabaseProdutos();

  const capacidadeForma = 40; // Capacidade fixa de 40 unidades por forma

  // Carregar agendamentos ao montar o componente
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

  // Verificar se há estoque manual configurado
  useEffect(() => {
    const estoqueManual = localStorage.getItem('estoque-manual-ajustes');
    setTemEstoqueManual(!!estoqueManual);
  }, []);

  // Processar dados de auditoria (mesma lógica da AuditoriaPCPTab)
  useEffect(() => {
    processarDadosAuditoria();
  }, [agendamentos, produtos, dataInicio, dataFim]);

  // Calcular projeção baseada nos dados da auditoria
  useEffect(() => {
    calcularProjecaoFromAuditoria();
  }, [dadosAuditoria, tipoAgendamento, produtos]);

  const processarDadosAuditoria = () => {
    console.log('🔍 Processando dados de auditoria para projeção...');
    
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    // Filtrar agendamentos no período (independente do status por enquanto)
    const agendamentosFiltrados = agendamentos.filter(agendamento => {
      const dataReposicao = new Date(agendamento.dataReposicao);
      const dentroPeríodo = dataReposicao >= inicio && dataReposicao <= fim;
      
      // Filtrar apenas clientes ativos
      const clienteAtivo = agendamento.cliente.statusCliente === 'Ativo';
      
      return dentroPeríodo && clienteAtivo;
    });

    console.log('📋 Agendamentos filtrados por período e cliente ativo:', agendamentosFiltrados.length);

    // Processar cada agendamento
    const dadosProcessados: AuditoriaItem[] = agendamentosFiltrados.map(agendamento => {
      const quantidadesPorProduto: Record<string, number> = {};
      
      // Inicializar todas as quantidades como 0
      produtosAtivos.forEach(nomeProduto => {
        quantidadesPorProduto[nomeProduto] = 0;
      });

      // Verificar se há pedido com itens específicos (tipo Alterado)
      if (agendamento.pedido && 
          agendamento.pedido.tipoPedido === 'Alterado' && 
          agendamento.pedido.itensPedido && 
          agendamento.pedido.itensPedido.length > 0) {
        
        // Para pedidos alterados, usar quantidades específicas dos itens
        agendamento.pedido.itensPedido.forEach(item => {
          const nomeProduto = item.nomeSabor || (item.sabor && item.sabor.nome);
          const quantidade = item.quantidadeSabor || 0;
          
          if (nomeProduto && quantidade > 0) {
            if (quantidadesPorProduto.hasOwnProperty(nomeProduto)) {
              quantidadesPorProduto[nomeProduto] = quantidade;
            }
          }
        });
      } else {
        // Para agendamentos padrão, usar a quantidade total
        const quantidadeTotal = agendamento.cliente.quantidadePadrao || 0;
        
        if (quantidadeTotal > 0 && produtosAtivos.length > 0) {
          // Distribuir toda a quantidade para o primeiro produto ativo
          const primeiroProduto = produtosAtivos[0];
          quantidadesPorProduto[primeiroProduto] = quantidadeTotal;
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

    setDadosAuditoria(dadosProcessados);
  };

  const calcularProjecaoFromAuditoria = () => {
    console.log('🧮 Calculando projeção baseada nos dados da auditoria...');

    // Filtrar dados de auditoria por status do agendamento
    const dadosFiltrados = dadosAuditoria.filter(item => {
      if (tipoAgendamento === 'agendados') {
        return item.statusAgendamento === 'Agendado';
      } else {
        return item.statusAgendamento === 'Agendado' || item.statusAgendamento === 'Previsto';
      }
    });

    console.log('📊 Dados filtrados por status do agendamento:', dadosFiltrados.length);

    // Obter estoque (manual se houver, senão automático)
    const estoqueManualData = localStorage.getItem('estoque-manual-ajustes');
    const estoqueManual = estoqueManualData ? JSON.parse(estoqueManualData) : {};

    // Calcular necessidades totais por produto
    const necessidadesTotais: Record<string, number> = {};
    
    produtosAtivos.forEach(nomeProduto => {
      necessidadesTotais[nomeProduto] = 0;
    });

    dadosFiltrados.forEach(item => {
      Object.keys(item.quantidadesPorProduto).forEach(nomeProduto => {
        const quantidade = item.quantidadesPorProduto[nomeProduto] || 0;
        if (necessidadesTotais[nomeProduto] !== undefined) {
          necessidadesTotais[nomeProduto] += quantidade;
        }
      });
    });

    console.log('📊 Necessidades totais por produto:', necessidadesTotais);

    // Calcular projeção para cada produto
    const projecao: ProjecaoItem[] = produtos
      .filter(produto => produto.ativo)
      .map(produto => {
        const unidadesNecessarias = necessidadesTotais[produto.nome] || 0;
        const estoqueDisponivel = estoqueManual[produto.id] !== undefined 
          ? estoqueManual[produto.id] 
          : produto.estoque_atual || 0;
        
        const unidadesProduzir = Math.max(0, unidadesNecessarias - estoqueDisponivel);
        const formasNecessarias = unidadesProduzir > 0 ? Math.ceil(unidadesProduzir / capacidadeForma) : 0;
        const sobraEstimada = formasNecessarias > 0 
          ? (formasNecessarias * capacidadeForma) - unidadesProduzir 
          : Math.max(0, estoqueDisponivel - unidadesNecessarias);

        console.log(`🧮 Cálculo para ${produto.nome}:`, {
          unidadesNecessarias,
          estoqueDisponivel,
          unidadesProduzir,
          formasNecessarias,
          sobraEstimada
        });

        return {
          idProduto: produto.id,
          nomeProduto: produto.nome,
          unidadesNecessarias,
          estoqueDisponivel,
          unidadesProduzir,
          formasNecessarias,
          sobraEstimada
        };
      })
      .filter(item => item.unidadesNecessarias > 0 || item.unidadesProduzir > 0);

    console.log('✅ Projeção final:', projecao);
    setProjecaoItens(projecao);
  };

  const totalFormas = projecaoItens.reduce((sum, item) => sum + item.formasNecessarias, 0);

  const exportarDados = (formato: 'pdf' | 'excel') => {
    const dados = projecaoItens.map(item => ({
      'Produto': item.nomeProduto,
      'Unidades Necessárias': item.unidadesNecessarias,
      'Estoque Disponível': item.estoqueDisponivel,
      'Unidades a Produzir': item.unidadesProduzir,
      'Formas Necessárias': item.formasNecessarias,
      'Sobra Estimada': item.sobraEstimada
    }));

    if (formato === 'excel') {
      const csvContent = [
        Object.keys(dados[0] || {}).join(','),
        ...dados.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `projecao-producao-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles de filtro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Projeção de Produção
          </CardTitle>
          <CardDescription>
            Calcule automaticamente a necessidade de produção com base nos dados da Auditoria PCP filtrados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controles de filtro */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="data-inicio">Data Início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="data-fim">Data Fim</Label>
              <Input
                id="data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={tipoAgendamento === 'agendados' ? 'default' : 'outline'}
                onClick={() => setTipoAgendamento('agendados')}
                size="sm"
              >
                Apenas Agendados
              </Button>
              <Button
                variant={tipoAgendamento === 'agendados-previstos' ? 'default' : 'outline'}
                onClick={() => setTipoAgendamento('agendados-previstos')}
                size="sm"
              >
                Agendados + Previstos
              </Button>
            </div>
          </div>

          {/* Indicador do modo ativo */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Considerando: {tipoAgendamento === 'agendados' ? 'somente agendamentos confirmados' : 'agendados + previstos'}
            </Badge>
            <Badge variant="outline">
              Clientes ativos apenas
            </Badge>
            {!temEstoqueManual && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Estoque não verificado manualmente
              </Badge>
            )}
          </div>

          {/* Info dos filtros aplicados */}
          <div className="text-xs text-muted-foreground">
            Capacidade por forma: {capacidadeForma} unidades | 
            Produtos ativos: {produtos.filter(p => p.ativo).length} | 
            Agendamentos na auditoria: {dadosAuditoria.length} |
            Considerados para cálculo: {dadosAuditoria.filter(item => {
              if (tipoAgendamento === 'agendados') {
                return item.statusAgendamento === 'Agendado';
              } else {
                return item.statusAgendamento === 'Agendado' || item.statusAgendamento === 'Previsto';
              }
            }).length}
          </div>
        </CardContent>
      </Card>

      {/* Alerta sobre estoque */}
      {!temEstoqueManual && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ⚠️ Estoque não verificado manualmente — projeção pode estar imprecisa.
            Considere usar a aba "Ajuste de Estoque" para validar os valores.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabela de projeção */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Necessidade de Produção</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportarDados('excel')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportarDados('pdf')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Unidades Necessárias</TableHead>
                  <TableHead className="text-right">Estoque Disponível</TableHead>
                  <TableHead className="text-right">Unidades a Produzir</TableHead>
                  <TableHead className="text-right">Formas Necessárias</TableHead>
                  <TableHead className="text-right">Sobra Estimada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projecaoItens.length > 0 ? (
                  projecaoItens.map((item) => (
                    <TableRow key={item.idProduto}>
                      <TableCell className="font-medium">{item.nomeProduto}</TableCell>
                      <TableCell className="text-right">{item.unidadesNecessarias}</TableCell>
                      <TableCell className="text-right">
                        <span className={item.estoqueDisponivel >= item.unidadesNecessarias ? 'text-green-600' : 'text-red-600'}>
                          {item.estoqueDisponivel}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.unidadesProduzir}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.formasNecessarias > 0 ? 'default' : 'secondary'}>
                          {item.formasNecessarias}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.sobraEstimada}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Calculator className="h-4 w-4" />
                        Nenhuma necessidade de produção identificada com os filtros aplicados
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Resumo */}
          {projecaoItens.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total de formas necessárias:</span>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {totalFormas} formas
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Baseado em {capacidadeForma} unidades por forma
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
