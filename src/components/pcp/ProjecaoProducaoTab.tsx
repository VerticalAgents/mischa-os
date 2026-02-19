import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Package, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { startOfWeek, endOfWeek } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import EstoqueDisponivel from "./EstoqueDisponivel";
import SugestaoProducao from "./SugestaoProducao";
import ProducaoAgendadaCard from "./ProducaoAgendadaCard";
import { useEstoqueDisponivel } from "@/hooks/useEstoqueDisponivel";
import { useProducaoAgendada } from "@/hooks/useProducaoAgendada";

interface ProdutoQuantidade {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
}

export default function ProjecaoProducaoTab() {
  const [incluirPrevistos, setIncluirPrevistos] = useState(false);
  const [percentualPrevistos, setPercentualPrevistos] = useState(50);
  const [loading, setLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [semanaAtual] = useState(new Date());
  const [quantidadesConfirmados, setQuantidadesConfirmados] = useState<Record<string, ProdutoQuantidade>>({});
  const [quantidadesPrevistos, setQuantidadesPrevistos] = useState<Record<string, ProdutoQuantidade>>({});

  const { agendamentos, carregarTodosAgendamentos } = useAgendamentoClienteStore();

  // Carregar agendamentos na montagem do componente
  useEffect(() => {
    const loadData = async () => {
      console.log('🚀 Carregando agendamentos para projeção...');
      if (agendamentos.length === 0) {
        await carregarTodosAgendamentos();
      }
    };
    loadData();
  }, [carregarTodosAgendamentos]);

  // Filtrar agendamentos da semana
  const agendamentosSemana = useMemo(() => {
    const inicioSemana = startOfWeek(semanaAtual, { weekStartsOn: 1 });
    const fimSemana = endOfWeek(semanaAtual, { weekStartsOn: 1 });
    
    const filtrados = agendamentos.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.dataReposicao);
      const dentroSemana = dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana;
      
      if (!dentroSemana) return false;
      
      if (incluirPrevistos) {
        return agendamento.statusAgendamento === "Agendado" || 
               agendamento.statusAgendamento === "Previsto";
      } else {
        return agendamento.statusAgendamento === "Agendado";
      }
    });

    return filtrados;
  }, [agendamentos, semanaAtual, incluirPrevistos]);

  // Calcular quantidades de produtos separando confirmados e previstos
  useEffect(() => {
    const calcularQuantidades = async () => {
      if (agendamentosSemana.length === 0) {
        setQuantidadesConfirmados({});
        setQuantidadesPrevistos({});
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const confirmadosTemp: Record<string, ProdutoQuantidade> = {};
        const previstosTemp: Record<string, ProdutoQuantidade> = {};

        for (const agendamento of agendamentosSemana) {
          if (!agendamento.id) continue;

          const { data, error } = await supabase.rpc('compute_entrega_itens_v2', {
            p_agendamento_id: agendamento.id
          });

          if (error) {
            console.error('❌ Erro ao calcular itens para agendamento', agendamento.id, ':', error);
            continue;
          }

          if (data && Array.isArray(data)) {
            const targetMap = agendamento.statusAgendamento === "Previsto" ? previstosTemp : confirmadosTemp;
            data.forEach((item: any) => {
              const produtoId = item.produto_id;
              if (targetMap[produtoId]) {
                targetMap[produtoId].quantidade += item.quantidade;
              } else {
                targetMap[produtoId] = {
                  produto_id: produtoId,
                  produto_nome: item.produto_nome,
                  quantidade: item.quantidade
                };
              }
            });
          }
        }

        setQuantidadesConfirmados(confirmadosTemp);
        setQuantidadesPrevistos(previstosTemp);
      } catch (error) {
        console.error('❌ Erro ao calcular quantidades:', error);
      } finally {
        setLoading(false);
      }
    };

    calcularQuantidades();
  }, [agendamentosSemana]);

  // Combinar confirmados + previstos com percentual
  const quantidadesPorProduto = useMemo(() => {
    const resultado: Record<string, ProdutoQuantidade> = {};

    for (const [id, produto] of Object.entries(quantidadesConfirmados)) {
      resultado[id] = { ...produto };
    }

    if (incluirPrevistos) {
      for (const [id, produto] of Object.entries(quantidadesPrevistos)) {
        const qtdAjustada = Math.ceil(produto.quantidade * percentualPrevistos / 100);
        if (resultado[id]) {
          resultado[id] = {
            ...resultado[id],
            quantidade: resultado[id].quantidade + qtdAjustada
          };
        } else {
          resultado[id] = { ...produto, quantidade: qtdAjustada };
        }
      }
    }

    return resultado;
  }, [quantidadesConfirmados, quantidadesPrevistos, incluirPrevistos, percentualPrevistos]);

  // Processar dados para visualização
  const produtosOrdenados = useMemo(() => {
    return Object.values(quantidadesPorProduto)
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [quantidadesPorProduto]);

  const quantidadeTotal = useMemo(() => {
    return produtosOrdenados.reduce((sum, produto) => sum + produto.quantidade, 0);
  }, [produtosOrdenados]);

  // Converter para formato esperado pelo EstoqueDisponivel
  const quantidadesNecessarias = useMemo(() => {
    const resultado: Record<string, number> = {};
    Object.values(quantidadesPorProduto).forEach(produto => {
      resultado[produto.produto_id] = produto.quantidade;
    });
    return resultado;
  }, [quantidadesPorProduto]);

  const ordemProdutosNecessarios = useMemo(() => {
    return produtosOrdenados.map(p => p.produto_id);
  }, [produtosOrdenados]);

  const { produtos: produtosEstoque } = useEstoqueDisponivel(quantidadesNecessarias);
  const { produtosAgrupados, mapaPorProduto, totalUnidades, totalRegistros, loading: loadingProducao } = useProducaoAgendada();

  // Estado do toggle de produção agendada (elevado ao nível do pai)
  const [incluirProducaoAgendada, setIncluirProducaoAgendada] = useState(false);

  // Estoque ajustado com produção agendada quando toggle ativo
  const estoqueAjustado = useMemo(() => {
    return produtosEstoque.map(p => {
      const extra = incluirProducaoAgendada ? (mapaPorProduto[p.produto_id] || 0) : 0;
      return {
        produto_id: p.produto_id,
        estoque_disponivel: p.estoque_disponivel + extra
      };
    });
  }, [produtosEstoque, mapaPorProduto, incluirProducaoAgendada]);

  const handlePercentualChange = (value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    setPercentualPrevistos(Math.min(100, Math.max(1, num)));
  };

  return (
    <div className="space-y-6">
      <ProducaoAgendadaCard
        produtos={produtosAgrupados}
        totalUnidades={totalUnidades}
        totalRegistros={totalRegistros}
        loading={loadingProducao}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Produtos Necessários
                </CardTitle>
                <CardDescription className="text-left">
                  {incluirPrevistos
                    ? `Quantidades para pedidos confirmados e ${percentualPrevistos}% dos previstos`
                    : "Quantidades para pedidos confirmados"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="incluir-previstos" className="text-sm cursor-pointer whitespace-nowrap">
                  Incluir previstos
                </Label>
                <Switch
                  id="incluir-previstos"
                  checked={incluirPrevistos}
                  onCheckedChange={setIncluirPrevistos}
                />
                {incluirPrevistos && (
                  <div className="flex items-center gap-1 animate-fade-in">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={percentualPrevistos}
                      onChange={(e) => handlePercentualChange(e.target.value)}
                      className="w-16 h-8 text-center text-sm px-1"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Calculando quantidades...</span>
              </div>
            ) : produtosOrdenados.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  Nenhum pedido {incluirPrevistos ? "confirmado ou previsto" : "confirmado"} nesta semana
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Quantidade Total Necessária</p>
                  <p className="text-3xl font-bold text-primary">{quantidadeTotal}</p>
                  <Badge variant="default" className="mt-2">
                    {agendamentosSemana.length} {agendamentosSemana.length === 1 ? 'pedido' : 'pedidos'}
                  </Badge>
                </div>

                <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Detalhes por Produto</p>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        {isDetailsOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="space-y-2">
                    {produtosOrdenados.map((produto: any) => (
                      <div 
                        key={produto.produto_id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{produto.produto_nome}</span>
                        </div>
                        <Badge variant="secondary" className="text-base px-3 py-1">
                          {produto.quantidade}
                        </Badge>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </CardContent>
        </Card>

        <EstoqueDisponivel 
          quantidadesNecessarias={quantidadesNecessarias}
          ordemProdutosNecessarios={ordemProdutosNecessarios}
          loadingNecessarios={loading}
          producaoAgendada={mapaPorProduto}
          incluirProducaoAgendada={incluirProducaoAgendada}
          onIncluirProducaoAgendadaChange={setIncluirProducaoAgendada}
        />
      </div>

      <SugestaoProducao 
        produtosNecessarios={produtosOrdenados}
        estoqueDisponivel={estoqueAjustado}
        loading={loading}
      />
    </div>
  );
}
