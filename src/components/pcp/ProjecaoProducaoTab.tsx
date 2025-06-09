
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Download, AlertTriangle, Calculator } from "lucide-react";
import { format } from "date-fns";
import { usePlanejamentoProducaoStore } from "@/hooks/usePlanejamentoProducaoStore";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";

interface ProjecaoItem {
  idProduto: string;
  nomeProduto: string;
  unidadesNecessarias: number;
  estoqueDisponivel: number;
  unidadesProduzir: number;
  formasNecessarias: number;
  sobraEstimada: number;
}

type TipoAgendamento = 'agendados' | 'agendados-previstos';

export default function ProjecaoProducaoTab() {
  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [tipoAgendamento, setTipoAgendamento] = useState<TipoAgendamento>('agendados');
  const [projecaoItens, setProjecaoItens] = useState<ProjecaoItem[]>([]);
  const [temEstoqueManual, setTemEstoqueManual] = useState(false);

  const { capacidadeForma, percentualPrevistos } = usePlanejamentoProducaoStore();
  const { produtos } = useSupabaseProdutos();
  const { agendamentos, carregarTodosAgendamentos } = useAgendamentoClienteStore();

  // Carregar agendamentos ao montar o componente
  useEffect(() => {
    carregarTodosAgendamentos();
  }, [carregarTodosAgendamentos]);

  // Verificar se há estoque manual configurado
  useEffect(() => {
    const estoqueManual = localStorage.getItem('estoque-manual-ajustes');
    setTemEstoqueManual(!!estoqueManual);
  }, []);

  // Calcular projeção quando parâmetros mudarem
  useEffect(() => {
    calcularProjecao();
  }, [dataInicio, dataFim, tipoAgendamento, agendamentos, produtos, capacidadeForma]);

  const calcularProjecao = () => {
    console.log('🔄 Iniciando cálculo de projeção...');
    
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    
    console.log('📅 Período:', { inicio, fim });
    console.log('📦 Total de agendamentos:', agendamentos.length);

    // Filtrar agendamentos no período
    const agendamentosNoPeriodo = agendamentos.filter(agendamento => {
      const dataReposicao = new Date(agendamento.dataReposicao);
      const dentroPeríodo = dataReposicao >= inicio && dataReposicao <= fim;
      
      // Filtrar por status conforme seleção
      let statusValido = false;
      if (tipoAgendamento === 'agendados') {
        statusValido = agendamento.statusAgendamento === 'Agendado';
      } else {
        statusValido = agendamento.statusAgendamento === 'Agendado' || agendamento.statusAgendamento === 'Previsto';
      }
      
      return dentroPeríodo && statusValido;
    });

    console.log('📋 Agendamentos no período:', agendamentosNoPeriodo.length);
    console.log('📋 Detalhes dos agendamentos:', agendamentosNoPeriodo.map(a => ({
      clienteNome: a.cliente.nome,
      dataReposicao: a.dataReposicao,
      statusAgendamento: a.statusAgendamento,
      quantidadePadrao: a.cliente.quantidadePadrao,
      pedido: a.pedido ? {
        tipoPedido: a.pedido.tipoPedido,
        totalUnidades: a.pedido.totalPedidoUnidades,
        itens: a.pedido.itensPedido
      } : null
    })));

    // Inicializar contadores por produto
    const necessidadePorProduto: Record<string, number> = {};

    produtos.forEach(produto => {
      if (produto.ativo) {
        necessidadePorProduto[produto.id] = 0;
      }
    });

    console.log('🏭 Produtos ativos:', produtos.filter(p => p.ativo).length);

    // Processar agendamentos
    let totalUnidadesProcessadas = 0;
    let agendamentosComDados = 0;
    let agendamentosPadrao = 0;
    let agendamentosAlterados = 0;
    
    agendamentosNoPeriodo.forEach(agendamento => {
      console.log(`\n📦 Processando agendamento ${agendamento.cliente.nome}`);
      
      // Verificar se há pedido com itens específicos (tipo Alterado)
      if (agendamento.pedido && agendamento.pedido.tipoPedido === 'Alterado' && agendamento.pedido.itensPedido && agendamento.pedido.itensPedido.length > 0) {
        console.log('📝 Agendamento ALTERADO com itens específicos:', agendamento.pedido.itensPedido);
        agendamentosAlterados++;
        
        // Para pedidos alterados, usar quantidades específicas dos itens
        agendamento.pedido.itensPedido.forEach(item => {
          // Mapear pelo nome do sabor/produto
          const produto = produtos.find(p => 
            p.nome === item.nomeSabor || 
            p.nome.toLowerCase().includes(item.nomeSabor?.toLowerCase() || '') ||
            (item.sabor && p.nome === item.sabor.nome)
          );
          
          if (produto && necessidadePorProduto[produto.id] !== undefined) {
            const quantidade = item.quantidadeSabor || 0;
            necessidadePorProduto[produto.id] += quantidade;
            totalUnidadesProcessadas += quantidade;
            console.log(`➕ Adicionado ${quantidade} unidades para ${produto.nome} (pedido alterado)`);
          } else {
            console.warn(`⚠️ Produto não encontrado para item: ${item.nomeSabor}`);
          }
        });
        agendamentosComDados++;
      } else {
        // Para agendamentos padrão, usar a quantidade total e distribuir 100% para o produto principal
        // Como não temos proporção padrão configurada, vamos assumir que a quantidade vai toda para o primeiro produto ativo
        const quantidadeTotal = agendamento.cliente.quantidadePadrao || 0;
        console.log(`📊 Agendamento PADRÃO com quantidade total: ${quantidadeTotal}`);
        agendamentosPadrao++;
        
        if (quantidadeTotal > 0) {
          // Para simplificar, vamos distribuir a quantidade para o primeiro produto ativo encontrado
          // Em um cenário real, isso deveria usar a proporção padrão configurada
          const produtoAtivo = produtos.find(p => p.ativo);
          if (produtoAtivo) {
            necessidadePorProduto[produtoAtivo.id] += quantidadeTotal;
            totalUnidadesProcessadas += quantidadeTotal;
            console.log(`➕ Adicionado ${quantidadeTotal} unidades para ${produtoAtivo.nome} (agendamento padrão)`);
            agendamentosComDados++;
          } else {
            console.warn('⚠️ Nenhum produto ativo encontrado para distribuir quantidade padrão');
          }
        } else {
          console.warn('⚠️ Agendamento padrão sem quantidade definida');
        }
      }
    });

    console.log('\n📊 Resumo do processamento:');
    console.log(`- Total de agendamentos processados: ${agendamentosNoPeriodo.length}`);
    console.log(`- Agendamentos com dados válidos: ${agendamentosComDados}`);
    console.log(`- Agendamentos padrão: ${agendamentosPadrao}`);
    console.log(`- Agendamentos alterados: ${agendamentosAlterados}`);
    console.log(`- Total de unidades processadas: ${totalUnidadesProcessadas}`);
    console.log('📊 Necessidades por produto:', necessidadePorProduto);

    // Adicionar pedidos previstos se selecionado
    if (tipoAgendamento === 'agendados-previstos') {
      const totalAgendado = Object.values(necessidadePorProduto).reduce((sum, val) => sum + val, 0);
      const totalPrevisto = Math.round(totalAgendado * (percentualPrevistos / 100));

      console.log('🔮 Adicionando previstos:', { totalAgendado, percentual: percentualPrevistos, totalPrevisto });

      if (totalPrevisto > 0) {
        // Distribuir o total previsto proporcionalmente aos produtos que já têm demanda
        const totalExistente = Object.values(necessidadePorProduto).reduce((sum, val) => sum + val, 0);
        if (totalExistente > 0) {
          Object.keys(necessidadePorProduto).forEach(produtoId => {
            if (necessidadePorProduto[produtoId] > 0) {
              const proporcao = necessidadePorProduto[produtoId] / totalExistente;
              const quantidadePrevista = Math.round(totalPrevisto * proporcao);
              necessidadePorProduto[produtoId] += quantidadePrevista;
              
              const produto = produtos.find(p => p.id === produtoId);
              console.log(`🔮 Adicionado ${quantidadePrevista} unidades previstas para ${produto?.nome}`);
            }
          });
        }
      }
    }

    // Obter estoque (manual se houver, senão automático)
    const estoqueManualData = localStorage.getItem('estoque-manual-ajustes');
    const estoqueManual = estoqueManualData ? JSON.parse(estoqueManualData) : {};

    console.log('📦 Estoque manual configurado:', !!estoqueManualData);

    // Calcular projeção para cada produto
    const projecao: ProjecaoItem[] = produtos
      .filter(produto => produto.ativo)
      .map(produto => {
        const unidadesNecessarias = necessidadePorProduto[produto.id] || 0;
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
          sobraEstimada,
          capacidadeForma
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
    // Implementação básica - em produção usaria bibliotecas específicas
    const dados = projecaoItens.map(item => ({
      'Sabor': item.nomeProduto,
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
            Calcule automaticamente a necessidade de produção com base nos agendamentos e estoque disponível
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
            {!temEstoqueManual && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Estoque não verificado manualmente
              </Badge>
            )}
          </div>

          {/* Debug info */}
          <div className="text-xs text-muted-foreground">
            Capacidade por forma: {capacidadeForma} unidades | 
            Produtos ativos: {produtos.filter(p => p.ativo).length} | 
            Agendamentos encontrados: {agendamentos.filter(a => {
              const dataReposicao = new Date(a.dataReposicao);
              const inicio = new Date(dataInicio);
              const fim = new Date(dataFim);
              const dentroPeríodo = dataReposicao >= inicio && dataReposicao <= fim;
              const statusValido = tipoAgendamento === 'agendados' 
                ? a.statusAgendamento === 'Agendado'
                : (a.statusAgendamento === 'Agendado' || a.statusAgendamento === 'Previsto');
              return dentroPeríodo && statusValido;
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
                        <Calendar className="h-4 w-4" />
                        Nenhuma necessidade de produção identificada no período
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
