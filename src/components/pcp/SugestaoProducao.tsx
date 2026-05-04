import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Factory, Loader2, ChevronDown, ChevronUp, AlertCircle, Filter, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRendimentosReceitaProduto } from "@/hooks/useRendimentosReceitaProduto";
import { useMediaVendasSemanais } from "@/hooks/useMediaVendasSemanais";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseProporoesPadrao } from "@/hooks/useSupabaseProporoesPadrao";
import { useConfigStore } from "@/hooks/useConfigStore";
import AgendarSugestoesEmMassaDialog, { SugestaoElegivel } from "./AgendarSugestoesEmMassaDialog";

interface ProdutoQuantidade {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
}

interface EstoqueDisponivel {
  produto_id: string;
  estoque_disponivel: number;
}

interface SugestaoProducaoProps {
  produtosNecessarios: ProdutoQuantidade[];
  estoqueDisponivel: EstoqueDisponivel[];
  loading?: boolean;
  onAgendamentoCriado?: () => void | Promise<void>;
}

interface SugestaoProducaoProduto {
  produto_id: string;
  produto_nome: string;
  quantidade_necessaria: number;
  estoque_disponivel: number;
  quantidade_a_produzir: number;
  rendimento: number | null;
  formas_sugeridas: number;
  tem_rendimento: boolean;
  nao_precisa_produzir: boolean;
  media_vendas_12_semanas: number;
  estoque_alvo: number;
  quantidade_base: number;
  quantidade_estoque_alvo: number;
  proporcao_padrao: number;
}

interface ProdutoFinal {
  id: string;
  nome: string;
}

export default function SugestaoProducao({ produtosNecessarios, estoqueDisponivel, loading = false, onAgendamentoCriado }: SugestaoProducaoProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [filtrarPorProporcao, setFiltrarPorProporcao] = useState(false);
  const [todosProdutos, setTodosProdutos] = useState<ProdutoFinal[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [agendarOpen, setAgendarOpen] = useState(false);
  
  const { obterRendimentoPorProduto, loading: loadingRendimentos } = useRendimentosReceitaProduto();
  const { mediaVendasPorProduto, loading: loadingMediaVendas } = useMediaVendasSemanais();
  const { proporcoes, loading: loadingProporcoes } = useSupabaseProporoesPadrao();
  const { configuracoesProducao } = useConfigStore();
  const modoAlvo = configuracoesProducao?.estoqueAlvoModo ?? "cobertura";
  const percentualAlvo = configuracoesProducao?.estoqueAlvoPercentual ?? 20;
  const coberturaAlvoDias =
    configuracoesProducao?.estoqueAlvoCoberturaDias ?? configuracoesProducao?.coberturaAlvoDias ?? 3;
  const fixoPorProduto = configuracoesProducao?.estoqueAlvoFixoPorProduto ?? {};

  // Buscar todos os produtos finais ativos
  useEffect(() => {
    const buscarProdutos = async () => {
      try {
        setLoadingProdutos(true);
        const { data, error } = await supabase
          .from('produtos_finais')
          .select('id, nome')
          .eq('ativo', true)
          .order('nome');

        if (error) throw error;
        setTodosProdutos(data || []);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        setTodosProdutos([]);
      } finally {
        setLoadingProdutos(false);
      }
    };

    buscarProdutos();
  }, []);

  // Calcular sugestões de produção para TODOS os produtos
  const sugestoesProducao = useMemo((): SugestaoProducaoProduto[] => {
    if (loadingRendimentos || loading || loadingMediaVendas || loadingProdutos || loadingProporcoes) return [];

    // Criar mapa de produtos necessários para lookup rápido
    const necessariosMap = new Map(
      produtosNecessarios.map(p => [p.produto_id, p.quantidade])
    );

    // Criar mapa de proporções para lookup rápido
    const proporcoesMap = new Map(
      proporcoes.map(p => [p.produto_id, p.percentual])
    );

    return todosProdutos.map(produto => {
      const quantidade_necessaria = necessariosMap.get(produto.id) || 0;
      const rendimentoInfo = obterRendimentoPorProduto(produto.id);
      const rendimento = rendimentoInfo?.rendimento || null;
      const tem_rendimento = !!rendimento && rendimento > 0;
      
      // Buscar estoque disponível do produto
      const estoqueInfo = estoqueDisponivel.find(e => e.produto_id === produto.id);
      const estoque_atual = estoqueInfo?.estoque_disponivel || 0;
      
      // Buscar proporção padrão
      const proporcao_padrao = proporcoesMap.get(produto.id) || 0;
      
      // 1. Estoque alvo conforme o modo configurado em Setup PCP
      const media_vendas = mediaVendasPorProduto[produto.id] || 0;
      let estoque_alvo = 0;
      if (modoAlvo === "fixo") {
        estoque_alvo = Math.max(0, Number(fixoPorProduto[produto.id]) || 0);
      } else if (modoAlvo === "percentual") {
        estoque_alvo = Math.round((media_vendas * percentualAlvo) / 100);
      } else {
        estoque_alvo = Math.round((media_vendas * coberturaAlvoDias) / 7);
      }
      
      // 2. Calcular quantidade base e quantidade para estoque alvo
      let quantidade_base = 0;
      let quantidade_estoque_alvo = 0;
      
      if (estoque_atual < 0) {
        // Estoque negativo (déficit): precisa cobrir déficit + atingir estoque alvo
        quantidade_base = -estoque_atual;
        quantidade_estoque_alvo = estoque_alvo;
      } else {
        // Estoque positivo: só precisa produzir o que falta para atingir estoque alvo
        quantidade_base = 0;
        quantidade_estoque_alvo = Math.max(0, estoque_alvo - estoque_atual);
      }
      
      // 3. Quantidade total a produzir
      const quantidade_a_produzir = quantidade_base + quantidade_estoque_alvo;
      
      // 4. Calcular formas necessárias: quantidade a produzir / rendimento
      const formas_sugeridas = tem_rendimento && quantidade_a_produzir > 0
        ? Math.ceil(quantidade_a_produzir / rendimento) 
        : 0;

      const nao_precisa_produzir = quantidade_a_produzir === 0;

      return {
        produto_id: produto.id,
        produto_nome: produto.nome,
        quantidade_necessaria,
        estoque_disponivel: estoque_atual,
        quantidade_a_produzir,
        rendimento,
        formas_sugeridas,
        tem_rendimento,
        nao_precisa_produzir,
        media_vendas_12_semanas: media_vendas,
        estoque_alvo,
        quantidade_base,
        quantidade_estoque_alvo: estoque_alvo,
        proporcao_padrao
      };
    });
  }, [todosProdutos, produtosNecessarios, estoqueDisponivel, obterRendimentoPorProduto, mediaVendasPorProduto, proporcoes, loadingRendimentos, loading, loadingMediaVendas, loadingProdutos, loadingProporcoes, modoAlvo, percentualAlvo, coberturaAlvoDias, fixoPorProduto]);

  // Filtrar produtos baseado no toggle
  const sugestoesFiltradas = useMemo(() => {
    if (filtrarPorProporcao) {
      return sugestoesProducao.filter(s => s.proporcao_padrao > 0);
    }
    return sugestoesProducao;
  }, [sugestoesProducao, filtrarPorProporcao]);

  // Calcular totais (usar sugestões filtradas)
  const totalFormas = useMemo(() => {
    return sugestoesFiltradas.reduce((sum, s) => sum + s.formas_sugeridas, 0);
  }, [sugestoesFiltradas]);

  const totalProdutosParaProduzir = useMemo(() => {
    return sugestoesFiltradas.filter(s => !s.nao_precisa_produzir && s.tem_rendimento).length;
  }, [sugestoesFiltradas]);

  const totalProdutosSemRendimento = useMemo(() => {
    return sugestoesFiltradas.filter(s => !s.tem_rendimento && !s.nao_precisa_produzir).length;
  }, [sugestoesFiltradas]);

  const totalProdutosNaoPrecisamProduzir = useMemo(() => {
    return sugestoesFiltradas.filter(s => s.nao_precisa_produzir).length;
  }, [sugestoesFiltradas]);

  const isLoading = loading || loadingRendimentos || loadingMediaVendas || loadingProdutos || loadingProporcoes;

  const sugestoesElegiveis: SugestaoElegivel[] = useMemo(() => {
    return sugestoesFiltradas
      .filter(s => s.tem_rendimento && s.formas_sugeridas > 0 && s.rendimento)
      .map(s => ({
        produto_id: s.produto_id,
        produto_nome: s.produto_nome,
        formas_sugeridas: s.formas_sugeridas,
        rendimento: s.rendimento as number,
        estoque_disponivel: s.estoque_disponivel,
        estoque_alvo: s.estoque_alvo,
        quantidade_a_produzir: s.quantidade_a_produzir,
      }));
  }, [sugestoesFiltradas]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-primary" />
              Sugestão de Produção
            </CardTitle>
            <CardDescription className="text-left">
              {modoAlvo === "fixo" && <>Alvo: <strong>fixo por produto</strong> · configure em <em>Setup</em></>}
              {modoAlvo === "percentual" && (
                <>Alvo: <strong>{percentualAlvo}%</strong> da média semanal · configure em <em>Setup</em></>
              )}
              {modoAlvo === "cobertura" && (
                <>Alvo: cobrir <strong>{coberturaAlvoDias} {coberturaAlvoDias === 1 ? "dia" : "dias"}</strong> de demanda · configure em <em>Setup</em></>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Label htmlFor="filtro-proporcao" className="text-sm text-muted-foreground cursor-pointer">
              <Filter className="h-4 w-4 inline mr-1" />
              Apenas com proporção
            </Label>
            <Switch 
              id="filtro-proporcao"
              checked={filtrarPorProporcao}
              onCheckedChange={setFiltrarPorProporcao}
            />
            <Button
              size="sm"
              onClick={() => setAgendarOpen(true)}
              disabled={sugestoesElegiveis.length === 0 || isLoading}
              className="gap-1"
            >
              <CalendarPlus className="h-4 w-4" />
              Agendar em massa
              {sugestoesElegiveis.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {sugestoesElegiveis.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Calculando sugestões...</span>
          </div>
        ) : sugestoesFiltradas.length === 0 ? (
          <div className="text-center py-8">
            <Factory className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              {filtrarPorProporcao 
                ? 'Nenhum produto com proporção padrão configurada'
                : 'Nenhum produto disponível'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total Geral */}
            <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border border-primary/20 text-center">
              <p className="text-sm text-muted-foreground mb-1">Total de Formas a Produzir</p>
              <p className="text-3xl font-bold text-primary">{totalFormas}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="default">
                  {totalProdutosParaProduzir} {totalProdutosParaProduzir === 1 ? 'produto' : 'produtos'}
                </Badge>
                {totalProdutosSemRendimento > 0 && (
                  <Badge variant="destructive">
                    {totalProdutosSemRendimento} sem rendimento
                  </Badge>
                )}
                {totalProdutosNaoPrecisamProduzir > 0 && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                    {totalProdutosNaoPrecisamProduzir} com estoque suficiente
                  </Badge>
                )}
              </div>
            </div>

            {/* Alerta se houver produtos sem rendimento */}
            {totalProdutosSemRendimento > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {totalProdutosSemRendimento} {totalProdutosSemRendimento === 1 ? 'produto não possui' : 'produtos não possuem'} rendimento cadastrado. 
                  Configure em <strong>Precificação {'>'} Rendimentos</strong>.
                </AlertDescription>
              </Alert>
            )}

            {/* Produtos Individuais - Collapsible */}
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
              <CollapsibleContent className="space-y-1.5">
                {sugestoesFiltradas.map((sugestao) => (
                  <div
                    key={sugestao.produto_id}
                    className="flex items-center justify-between gap-3 px-3 py-2 border rounded-md hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{sugestao.produto_nome}</p>
                      {sugestao.nao_precisa_produzir ? (
                        <p className="text-xs text-muted-foreground">
                          Estoque {sugestao.estoque_disponivel} ≥ alvo {sugestao.estoque_alvo}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Estoque {sugestao.estoque_disponivel} → alvo {sugestao.estoque_alvo}
                          {" · produzir "}
                          <strong className="text-foreground">{sugestao.quantidade_a_produzir} un</strong>
                          {sugestao.tem_rendimento && (
                            <span> (÷ {sugestao.rendimento} un/forma)</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {sugestao.nao_precisa_produzir ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                          Estoque OK
                        </Badge>
                      ) : sugestao.tem_rendimento ? (
                        <Badge variant="default">{sugestao.formas_sugeridas} formas</Badge>
                      ) : (
                        <Badge variant="destructive">sem rendimento</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>
      <AgendarSugestoesEmMassaDialog
        isOpen={agendarOpen}
        onClose={() => setAgendarOpen(false)}
        sugestoes={sugestoesElegiveis}
        onSuccess={onAgendamentoCriado}
      />
    </Card>
  );
}
