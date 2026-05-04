import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Package, Loader2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { startOfWeek, endOfWeek, addWeeks, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useConfirmationScore } from "@/hooks/useConfirmationScore";
import EstoqueDisponivel from "./EstoqueDisponivel";
import SugestaoProducao from "./SugestaoProducao";
import ProducaoAgendadaCard from "./ProducaoAgendadaCard";
import EstoqueProdutosSaldoRealCard from "./EstoqueProdutosSaldoRealCard";
import { HistoricoProducaoModal } from "./HistoricoProducaoModal";
import { useSupabaseHistoricoProducao } from "@/hooks/useSupabaseHistoricoProducao";
import { useEstoqueDisponivel } from "@/hooks/useEstoqueDisponivel";
import { useProducaoAgendada } from "@/hooks/useProducaoAgendada";
import { useValidacaoInsumosProducaoAgendada } from "@/hooks/useValidacaoInsumosProducaoAgendada";

interface ProdutoQuantidade {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
}

export default function ProjecaoProducaoTab() {
  const [incluirPrevistos, setIncluirPrevistos] = useState(false);
  const [modoPrevistos, setModoPrevistos] = useState<'provaveis' | 'percentual'>('percentual');
  const [percentualPrevistos, setPercentualPrevistos] = useState(50);
  const [loading, setLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [semanaAtual, setSemanaAtual] = useState(new Date());
  const [quantidadesConfirmados, setQuantidadesConfirmados] = useState<Record<string, ProdutoQuantidade>>({});
  const [quantidadesPrevistos, setQuantidadesPrevistos] = useState<Record<string, ProdutoQuantidade>>({});
  const [quantidadesPrevistosProvaveis, setQuantidadesPrevistosProvaveis] = useState<Record<string, ProdutoQuantidade>>({});

  const { agendamentos, carregarTodosAgendamentos } = useAgendamentoClienteStore();

  useEffect(() => {
    if (agendamentos.length === 0) {
      carregarTodosAgendamentos();
    }
  }, [carregarTodosAgendamentos]);

  const inicioSemana = useMemo(() => startOfWeek(semanaAtual, { weekStartsOn: 1 }), [semanaAtual]);
  const fimSemana = useMemo(() => endOfWeek(semanaAtual, { weekStartsOn: 1 }), [semanaAtual]);

  const agendamentosConfirmadosSemana = useMemo(() => {
    return agendamentos.filter(a => {
      const d = new Date(a.dataReposicao);
      return d >= inicioSemana && d <= fimSemana && a.statusAgendamento === "Agendado";
    });
  }, [agendamentos, inicioSemana, fimSemana]);

  const agendamentosPrevistosSemana = useMemo(() => {
    return agendamentos.filter(a => {
      const d = new Date(a.dataReposicao);
      return d >= inicioSemana && d <= fimSemana && a.statusAgendamento === "Previsto";
    });
  }, [agendamentos, inicioSemana, fimSemana]);

  const { scores } = useConfirmationScore(agendamentosPrevistosSemana);

  const previstosProvaveis = useMemo(() => {
    return agendamentosPrevistosSemana.filter(a => (scores.get(a.cliente.id)?.score ?? 0) > 85);
  }, [agendamentosPrevistosSemana, scores]);

  useEffect(() => {
    const fetchQuantidades = async (lista: any[]) => {
      const out: Record<string, ProdutoQuantidade> = {};
      for (const ag of lista) {
        if (!ag.id) continue;
        const { data, error } = await supabase.rpc('compute_entrega_itens_v2', { p_agendamento_id: ag.id });
        if (error || !Array.isArray(data)) continue;
        data.forEach((item: any) => {
          if (out[item.produto_id]) {
            out[item.produto_id].quantidade += item.quantidade;
          } else {
            out[item.produto_id] = { produto_id: item.produto_id, produto_nome: item.produto_nome, quantidade: item.quantidade };
          }
        });
      }
      return out;
    };

    const calcular = async () => {
      setLoading(true);
      try {
        const [conf, prev, prov] = await Promise.all([
          fetchQuantidades(agendamentosConfirmadosSemana),
          fetchQuantidades(agendamentosPrevistosSemana),
          fetchQuantidades(previstosProvaveis),
        ]);
        setQuantidadesConfirmados(conf);
        setQuantidadesPrevistos(prev);
        setQuantidadesPrevistosProvaveis(prov);
      } finally {
        setLoading(false);
      }
    };
    calcular();
  }, [agendamentosConfirmadosSemana, agendamentosPrevistosSemana, previstosProvaveis]);

  const quantidadesPorProduto = useMemo(() => {
    const resultado: Record<string, ProdutoQuantidade> = {};
    for (const [id, p] of Object.entries(quantidadesConfirmados)) {
      resultado[id] = { ...p };
    }
    if (incluirPrevistos) {
      if (modoPrevistos === 'provaveis') {
        for (const [id, p] of Object.entries(quantidadesPrevistosProvaveis)) {
          if (resultado[id]) resultado[id].quantidade += p.quantidade;
          else resultado[id] = { ...p };
        }
      } else {
        for (const [id, p] of Object.entries(quantidadesPrevistos)) {
          const q = Math.ceil(p.quantidade * percentualPrevistos / 100);
          if (resultado[id]) resultado[id].quantidade += q;
          else resultado[id] = { ...p, quantidade: q };
        }
      }
    }
    return resultado;
  }, [quantidadesConfirmados, quantidadesPrevistos, quantidadesPrevistosProvaveis, incluirPrevistos, modoPrevistos, percentualPrevistos]);

  const produtosOrdenados = useMemo(
    () => Object.values(quantidadesPorProduto).sort((a, b) => b.quantidade - a.quantidade),
    [quantidadesPorProduto]
  );

  const quantidadeTotal = useMemo(
    () => produtosOrdenados.reduce((s, p) => s + p.quantidade, 0),
    [produtosOrdenados]
  );

  const quantidadesNecessarias = useMemo(() => {
    const r: Record<string, number> = {};
    Object.values(quantidadesPorProduto).forEach(p => { r[p.produto_id] = p.quantidade; });
    return r;
  }, [quantidadesPorProduto]);

  const ordemProdutosNecessarios = useMemo(() => produtosOrdenados.map(p => p.produto_id), [produtosOrdenados]);

  const { produtos: produtosEstoque } = useEstoqueDisponivel(quantidadesNecessarias);
  const { mapaPorProduto, totalUnidades, totalRegistros, diasAgendados, loading: loadingProducao, recarregar: recarregarProducaoAgendada } = useProducaoAgendada();
  const validacoesInsumos = useValidacaoInsumosProducaoAgendada(diasAgendados);
  const { adicionarRegistro } = useSupabaseHistoricoProducao();
  const [modalNovaProducao, setModalNovaProducao] = useState(false);

  const estoqueAjustado = useMemo(() => {
    return produtosEstoque.map(p => {
      const extra = mapaPorProduto[p.produto_id] || 0;
      return { produto_id: p.produto_id, estoque_disponivel: p.estoque_disponivel + extra };
    });
  }, [produtosEstoque, mapaPorProduto]);

  const handlePercentualChange = (value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    setPercentualPrevistos(Math.min(100, Math.max(1, num)));
  };

  const totalPedidos = agendamentosConfirmadosSemana.length + (
    incluirPrevistos
      ? (modoPrevistos === 'provaveis' ? previstosProvaveis.length : agendamentosPrevistosSemana.length)
      : 0
  );

  const isProvavelMode = incluirPrevistos && modoPrevistos === 'provaveis';

  const semanaAtualReal = startOfWeek(new Date(), { weekStartsOn: 1 });
  const isSemanaAtual = inicioSemana.getTime() === semanaAtualReal.getTime();

  const handleSalvarProducao = async (dados: any) => {
    await adicionarRegistro({
      data_producao: dados.dataProducao.toISOString().split('T')[0],
      produto_id: dados.produtoId,
      produto_nome: dados.produtoNome,
      formas_producidas: dados.formasProducidas,
      unidades_calculadas: dados.unidadesCalculadas || dados.unidadesPrevistas,
      turno: dados.turno || 'Matutino',
      observacoes: dados.observacoes,
      origem: dados.origem,
      rendimento_usado: dados.rendimentoUsado,
      unidades_previstas: dados.unidadesPrevistas,
      status: dados.status,
    } as any);
    await recarregarProducaoAgendada();
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Semana */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">
                Semana: {format(inicioSemana, "dd 'de' MMM", { locale: ptBR })} – {format(fimSemana, "dd 'de' MMM yyyy", { locale: ptBR })}
              </span>
              {isSemanaAtual && <Badge variant="outline">Atual</Badge>}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setSemanaAtual(addWeeks(semanaAtual, -1))}>
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              {!isSemanaAtual && (
                <Button variant="ghost" size="sm" onClick={() => setSemanaAtual(new Date())}>
                  Semana atual
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setSemanaAtual(addWeeks(semanaAtual, 1))}>
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Linha 1: Estoque atual + Produção agendada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <EstoqueProdutosSaldoRealCard />
        <ProducaoAgendadaCard
          dias={diasAgendados}
          validacoes={validacoesInsumos}
          totalUnidades={totalUnidades}
          totalRegistros={totalRegistros}
          loading={loadingProducao}
          onNovaProducao={() => setModalNovaProducao(true)}
          onRecarregar={recarregarProducaoAgendada}
        />
      </div>

      {/* Linha 2: Necessários + Estoque disponível final */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <Card className={`h-full flex flex-col ${isProvavelMode ? 'border-purple-300 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20' : ''}`}>
          <CardHeader>
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2">
                <Package className={`h-5 w-5 ${isProvavelMode ? 'text-purple-500' : 'text-primary'}`} />
                Produtos Necessários
              </CardTitle>
              <CardDescription className="text-left">
                {incluirPrevistos
                  ? (modoPrevistos === 'provaveis'
                      ? "Confirmados + previstos prováveis"
                      : `Confirmados + ${percentualPrevistos}% dos previstos`)
                  : "Quantidades para pedidos confirmados"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="flex items-center justify-end gap-2 sm:gap-3 flex-wrap pb-3 mb-3 border-b min-h-[2.25rem]">
              <div className="flex items-center gap-2">
                <Label htmlFor="incluir-previstos" className="text-sm cursor-pointer whitespace-nowrap">
                  Incluir previstos
                </Label>
                <Switch id="incluir-previstos" checked={incluirPrevistos} onCheckedChange={setIncluirPrevistos} />
              </div>
              {incluirPrevistos && (
                <RadioGroup
                  value={modoPrevistos}
                  onValueChange={(v) => setModoPrevistos(v as 'provaveis' | 'percentual')}
                  className="flex items-center gap-3"
                >
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="provaveis" id="pcp-modo-provaveis" />
                    <Label htmlFor="pcp-modo-provaveis" className="text-xs cursor-pointer whitespace-nowrap">
                      Apenas prováveis
                    </Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="percentual" id="pcp-modo-percentual" />
                    <Label htmlFor="pcp-modo-percentual" className="text-xs cursor-pointer whitespace-nowrap">
                      Percentual
                    </Label>
                  </div>
                </RadioGroup>
              )}
              {incluirPrevistos && modoPrevistos === 'percentual' && (
                <div className="flex items-center gap-1">
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
                <div className={`p-4 rounded-lg border ${isProvavelMode ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800' : 'bg-primary/10 dark:bg-primary/20 border-primary/20'}`}>
                  <p className="text-sm text-muted-foreground mb-1">Quantidade Total Necessária</p>
                  <p className={`text-3xl font-bold ${isProvavelMode ? 'text-purple-600' : 'text-primary'}`}>
                    {quantidadeTotal}
                  </p>
                  <Badge variant="default" className={`mt-2 ${isProvavelMode ? 'bg-purple-200 text-purple-900 hover:bg-purple-200' : ''}`}>
                    {totalPedidos} {totalPedidos === 1 ? 'pedido' : 'pedidos'}
                  </Badge>
                </div>

                <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Detalhes por Produto</p>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        {isDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="space-y-2">
                    {produtosOrdenados.map((produto) => (
                      <div key={produto.produto_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
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
        />
      </div>

      {/* Linha 3: Sugestão de produção (largura reduzida) */}
      <div className="max-w-3xl mx-auto w-full">
        <SugestaoProducao
          produtosNecessarios={produtosOrdenados}
          estoqueDisponivel={estoqueAjustado}
          loading={loading}
          onAgendamentoCriado={recarregarProducaoAgendada}
        />
      </div>

      <HistoricoProducaoModal
        isOpen={modalNovaProducao}
        onClose={() => setModalNovaProducao(false)}
        onSuccess={handleSalvarProducao}
      />
    </div>
  );
}
