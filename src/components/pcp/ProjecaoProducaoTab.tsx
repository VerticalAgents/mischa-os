
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Calculator, Download } from "lucide-react";
import { format } from "date-fns";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { useProporoesPadrao } from "@/hooks/useProporoesPadrao";

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

  const { agendamentos, carregarTodosAgendamentos, carregarAgendamentoPorCliente } = useAgendamentoClienteStore();
  const { produtos } = useSupabaseProdutos();
  const { calcularQuantidadesPorProporcao, temProporcoesConfiguradas } = useProporoesPadrao();

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

  // Processar dados de auditoria (usando a MESMA lógica da AuditoriaPCPTab)
  useEffect(() => {
    processarDadosAuditoria();
  }, [agendamentos, produtos, dataInicio, dataFim, calcularQuantidadesPorProporcao, temProporcoesConfiguradas]);

  // Calcular projeção baseada nos dados da auditoria
  useEffect(() => {
    calcularProjecaoFromAuditoria();
  }, [dadosAuditoria, tipoAgendamento, produtos]);

  const processarDadosAuditoria = async () => {
    console.log('🔍 Processando dados de auditoria para projeção...');
    console.log('📊 Total de agendamentos:', agendamentos.length);
    console.log('🏭 Produtos ativos:', produtos.filter(p => p.ativo).length);

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    // Filtrar agendamentos
    const agendamentosFiltrados = agendamentos.filter(agendamento => {
      const dataReposicao = new Date(agendamento.dataReposicao);
      
      // Filtro por período
      const dentroPeríodo = dataReposicao >= inicio && dataReposicao <= fim;
      
      // Filtrar apenas clientes ativos
      const clienteAtivo = agendamento.cliente.statusCliente === 'Ativo';
      
      return dentroPeríodo && clienteAtivo;
    });

    console.log('📋 Agendamentos filtrados:', agendamentosFiltrados.length);

    // Processar cada agendamento (MESMA LÓGICA da AuditoriaPCPTab)
    const dadosProcessados: AuditoriaItem[] = [];
    
    for (const agendamento of agendamentosFiltrados) {
      const quantidadesPorProduto: Record<string, number> = {};
      
      // Inicializar todas as quantidades como 0
      produtosAtivos.forEach(nomeProduto => {
        quantidadesPorProduto[nomeProduto] = 0;
      });

      console.log(`\n📦 Processando agendamento: ${agendamento.cliente.nome}`);
      console.log('🔍 Tipo de pedido:', agendamento.pedido?.tipoPedido || 'Padrão');

      // Primeiro, verificar se há dados na tabela agendamentos_clientes
      try {
        const agendamentoCompleto = await carregarAgendamentoPorCliente(agendamento.cliente.id);
        
        if (agendamentoCompleto) {
          console.log('✅ Dados encontrados na tabela agendamentos_clientes:', {
            tipo: agendamentoCompleto.tipo_pedido,
            quantidade_total: agendamentoCompleto.quantidade_total,
            itens_personalizados: agendamentoCompleto.itens_personalizados
          });

          if (agendamentoCompleto.tipo_pedido === 'Alterado' && 
              agendamentoCompleto.itens_personalizados && 
              agendamentoCompleto.itens_personalizados.length > 0) {
            
            // Para pedidos alterados, usar os itens personalizados salvos
            console.log('📝 Usando itens personalizados salvos:', agendamentoCompleto.itens_personalizados);
            
            agendamentoCompleto.itens_personalizados.forEach(item => {
              if (quantidadesPorProduto.hasOwnProperty(item.produto)) {
                quantidadesPorProduto[item.produto] = item.quantidade;
                console.log(`➕ ${item.produto}: ${item.quantidade} unidades (personalizado)`);
              }
            });
          } else if (agendamentoCompleto.tipo_pedido === 'Padrão') {
            // Para pedidos padrão, calcular usando as proporções
            const quantidadeTotal = agendamentoCompleto.quantidade_total;
            console.log(`📊 Processando pedido PADRÃO com quantidade total: ${quantidadeTotal}`);
            
            if (quantidadeTotal > 0 && temProporcoesConfiguradas()) {
              try {
                const quantidadesCalculadas = await calcularQuantidadesPorProporcao(quantidadeTotal);
                console.log('🧮 Quantidades calculadas pela proporção:', quantidadesCalculadas);
                
                quantidadesCalculadas.forEach(item => {
                  if (quantidadesPorProduto.hasOwnProperty(item.produto)) {
                    quantidadesPorProduto[item.produto] = item.quantidade;
                    console.log(`➕ ${item.produto}: ${item.quantidade} unidades (proporção padrão)`);
                  }
                });
              } catch (error) {
                console.error('❌ Erro ao calcular quantidades por proporção:', error);
              }
            }
          }
        } else {
          // Fallback para dados da lista de agendamentos (método antigo)
          console.log('⚠️ Usando dados da lista de agendamentos como fallback');
          
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
                  console.log(`➕ ${nomeProduto}: ${quantidade} unidades (pedido alterado - fallback)`);
                }
              }
            });
          } else {
            // Para agendamentos padrão, usar a quantidade total do cliente
            const quantidadeTotal = agendamento.cliente.quantidadePadrao || 0;
            console.log(`📊 Processando agendamento PADRÃO (fallback) com quantidade total: ${quantidadeTotal}`);
            
            if (quantidadeTotal > 0 && temProporcoesConfiguradas()) {
              try {
                const quantidadesCalculadas = await calcularQuantidadesPorProporcao(quantidadeTotal);
                console.log('🧮 Quantidades calculadas pela proporção (fallback):', quantidadesCalculadas);
                
                quantidadesCalculadas.forEach(item => {
                  if (quantidadesPorProduto.hasOwnProperty(item.produto)) {
                    quantidadesPorProduto[item.produto] = item.quantidade;
                    console.log(`➕ ${item.produto}: ${item.quantidade} unidades (proporção padrão - fallback)`);
                  }
                });
              } catch (error) {
                console.error('❌ Erro ao calcular quantidades por proporção (fallback):', error);
                // Em caso de erro, distribuir para o primeiro produto como último recurso
                if (produtosAtivos.length > 0) {
                  const primeiroProduto = produtosAtivos[0];
                  quantidadesPorProduto[primeiroProduto] = quantidadeTotal;
                  console.log(`➕ ${primeiroProduto}: ${quantidadeTotal} unidades (fallback final)`);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro ao processar agendamento:', error);
      }

      dadosProcessados.push({
        clienteNome: agendamento.cliente.nome,
        statusAgendamento: agendamento.statusAgendamento,
        dataReposicao: agendamento.dataReposicao,
        statusCliente: agendamento.cliente.statusCliente || 'Ativo',
        quantidadesPorProduto
      });
    }

    console.log('✅ Dados de auditoria processados:', dadosProcessados.length);
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

    // Calcular necessidades totais por produto - CORRIGIDO PARA PROCESSAR TODOS OS PRODUTOS
    console.log('🔄 Calculando necessidades totais por produto...');
    
    const necessidadesTotais: Record<string, number> = {};
    
    // Inicializar todos os produtos ativos com 0
    produtosAtivos.forEach(nomeProduto => {
      necessidadesTotais[nomeProduto] = 0;
    });

    // Somar quantidades de todos os agendamentos filtrados
    dadosFiltrados.forEach(item => {
      console.log(`📦 Processando agendamento: ${item.clienteNome}`, item.quantidadesPorProduto);
      
      Object.keys(item.quantidadesPorProduto).forEach(nomeProduto => {
        const quantidade = item.quantidadesPorProduto[nomeProduto] || 0;
        if (quantidade > 0) {
          if (necessidadesTotais[nomeProduto] !== undefined) {
            necessidadesTotais[nomeProduto] += quantidade;
            console.log(`➕ ${nomeProduto}: +${quantidade} = ${necessidadesTotais[nomeProduto]} total`);
          }
        }
      });
    });

    console.log('📊 Necessidades totais finais por produto:', necessidadesTotais);

    // Calcular projeção para cada produto que tem necessidade > 0
    const projecao: ProjecaoItem[] = [];

    Object.keys(necessidadesTotais).forEach(nomeProduto => {
      const unidadesNecessarias = necessidadesTotais[nomeProduto];
      
      if (unidadesNecessarias > 0) {
        // Encontrar o produto correspondente
        const produto = produtos.find(p => p.nome === nomeProduto && p.ativo);
        
        if (produto) {
          const estoqueDisponivel = estoqueManual[produto.id] !== undefined 
            ? estoqueManual[produto.id] 
            : produto.estoque_atual || 0;
          
          const unidadesProduzir = Math.max(0, unidadesNecessarias - estoqueDisponivel);
          const formasNecessarias = unidadesProduzir > 0 ? Math.ceil(unidadesProduzir / capacidadeForma) : 0;
          const sobraEstimada = formasNecessarias > 0 
            ? (formasNecessarias * capacidadeForma) - unidadesProduzir 
            : Math.max(0, estoqueDisponivel - unidadesNecessarias);

          console.log(`🧮 Cálculo para ${nomeProduto}:`, {
            unidadesNecessarias,
            estoqueDisponivel,
            unidadesProduzir,
            formasNecessarias,
            sobraEstimada
          });

          projecao.push({
            idProduto: produto.id,
            nomeProduto: produto.nome,
            unidadesNecessarias,
            estoqueDisponivel,
            unidadesProduzir,
            formasNecessarias,
            sobraEstimada
          });
        }
      }
    });

    console.log('✅ Projeção final com todos os produtos:', projecao);
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
