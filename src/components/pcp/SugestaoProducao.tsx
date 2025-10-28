import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Factory, Loader2, ChevronDown, ChevronUp, AlertCircle, Info, Target, Package, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRendimentosReceitaProduto } from "@/hooks/useRendimentosReceitaProduto";
import { useMediaVendasSemanais } from "@/hooks/useMediaVendasSemanais";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseProporoesPadrao } from "@/hooks/useSupabaseProporoesPadrao";

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

export default function SugestaoProducao({ produtosNecessarios, estoqueDisponivel, loading = false }: SugestaoProducaoProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [filtrarPorProporcao, setFiltrarPorProporcao] = useState(false);
  const [todosProdutos, setTodosProdutos] = useState<ProdutoFinal[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  
  const { obterRendimentoPorProduto, loading: loadingRendimentos } = useRendimentosReceitaProduto();
  const { mediaVendasPorProduto, loading: loadingMediaVendas } = useMediaVendasSemanais();
  const { proporcoes, loading: loadingProporcoes } = useSupabaseProporoesPadrao();

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
      
      // 1. Calcular estoque alvo (20% da média de vendas das últimas 12 semanas)
      const media_vendas = mediaVendasPorProduto[produto.id] || 0;
      const estoque_alvo = Math.round(media_vendas * 0.20);
      
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
  }, [todosProdutos, produtosNecessarios, estoqueDisponivel, obterRendimentoPorProduto, mediaVendasPorProduto, proporcoes, loadingRendimentos, loading, loadingMediaVendas, loadingProdutos, loadingProporcoes]);

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
              Quantidade de formas a produzir baseada nos rendimentos cadastrados
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="filtro-proporcao" className="text-sm text-muted-foreground cursor-pointer">
              <Filter className="h-4 w-4 inline mr-1" />
              Apenas com proporção
            </Label>
            <Switch 
              id="filtro-proporcao"
              checked={filtrarPorProporcao}
              onCheckedChange={setFiltrarPorProporcao}
            />
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
            {/* Alerta Informativo - Estoque Alvo */}
            <Alert className="bg-blue-500/10 border-blue-500/20">
              <Info className="h-4 w-4" />
              <AlertDescription>
                As sugestões incluem <strong>estoque alvo de 20%</strong> da média das últimas 12 semanas, 
                garantindo produto disponível para pedidos de última hora.
              </AlertDescription>
            </Alert>

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
              <CollapsibleContent className="space-y-2">
                {sugestoesFiltradas.map((sugestao) => (
                  <TooltipProvider key={sugestao.produto_id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="border rounded-lg hover:bg-muted/50 transition-colors overflow-hidden">
                          {/* Cabeçalho */}
                          <div className="flex items-center justify-between p-3 pb-2">
                            <div className="flex items-center gap-3 text-left flex-1">
                              <Factory className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">
                                <span className="font-medium">{sugestao.produto_nome}</span>
                                <p className="text-xs text-muted-foreground mt-0.5 text-left">
                                  Necessário: {sugestao.quantidade_necessaria} | Estoque: {sugestao.estoque_disponivel}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {sugestao.nao_precisa_produzir ? (
                                <Badge 
                                  variant="outline"
                                  className="text-base px-3 py-1 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                >
                                  Estoque OK
                                </Badge>
                              ) : (
                                <Badge 
                                  variant={sugestao.tem_rendimento ? "default" : "destructive"}
                                  className="text-base px-3 py-1"
                                >
                                  {sugestao.tem_rendimento ? `${sugestao.formas_sugeridas} formas` : '—'}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Detalhamento da Produção */}
                          {!sugestao.nao_precisa_produzir && (
                            <div className="px-3 pb-3 pt-1 border-t border-dashed space-y-1.5">
                              {/* Produção Base */}
                              {sugestao.quantidade_base > 0 && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Package className="h-3 w-3 text-red-500" />
                                  <span className="text-muted-foreground">Produção Base:</span>
                                  <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 text-xs px-2 py-0">
                                    {sugestao.quantidade_base} un
                                  </Badge>
                                  <span className="text-muted-foreground text-[10px]">(cobrir déficit)</span>
                                </div>
                              )}
                              
                              {/* Estoque Alvo */}
                              {sugestao.estoque_alvo > 0 ? (
                                <div className="flex items-center gap-2 text-xs">
                                  <Target className="h-3 w-3 text-green-500" />
                                  <span className="text-muted-foreground">Estoque Alvo:</span>
                                  <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-xs px-2 py-0">
                                    +{sugestao.estoque_alvo} un
                                  </Badge>
                                  <span className="text-muted-foreground text-[10px]">
                                    (20% média: {sugestao.media_vendas_12_semanas} un/sem)
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-xs">
                                  <Target className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Estoque Alvo:</span>
                                  <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-muted text-xs px-2 py-0">
                                    0 un
                                  </Badge>
                                  <span className="text-muted-foreground text-[10px]">(sem histórico)</span>
                                </div>
                              )}

                              {/* Total e Cálculo de Formas */}
                              <div className="flex items-center gap-2 text-xs pt-1 border-t border-dashed">
                                <Factory className="h-3 w-3 text-primary" />
                                <span className="font-medium text-foreground">Total:</span>
                                <Badge variant="default" className="text-xs px-2 py-0">
                                  {sugestao.quantidade_a_produzir} un
                                </Badge>
                                {sugestao.tem_rendimento ? (
                                  <span className="text-muted-foreground text-[10px]">
                                    ÷ {sugestao.rendimento} un/forma = {sugestao.formas_sugeridas} formas
                                  </span>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 px-2 py-0">
                                    Sem rendimento
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="text-xs space-y-2">
                          <div className="font-semibold border-b pb-1">Cálculo Detalhado</div>
                          
                          {/* Histórico */}
                          <div className="space-y-0.5">
                            <p className="font-medium">📊 Histórico (12 semanas):</p>
                            <p className="pl-4">
                              • Média semanal: <strong>{sugestao.media_vendas_12_semanas} unidades</strong>
                            </p>
                          </div>

                          {/* Estoque Alvo */}
                          <div className="space-y-0.5">
                            <p className="font-medium">🎯 Estoque Alvo:</p>
                            <p className="pl-4">
                              • 20% da média: <strong>{sugestao.estoque_alvo} unidades</strong>
                            </p>
                            <p className="pl-4 text-muted-foreground text-[10px]">
                              Garante segurança para pedidos extras
                            </p>
                          </div>

                          {/* Necessidade de Produção */}
                          <div className="space-y-0.5">
                            <p className="font-medium">📦 Necessidade de Produção:</p>
                            <p className="pl-4">• Déficit atual: <strong>{sugestao.quantidade_base} unidades</strong></p>
                            <p className="pl-4">• Estoque alvo: <strong>+{sugestao.estoque_alvo} unidades</strong></p>
                            <p className="pl-4">• Total a produzir: <strong>{sugestao.quantidade_a_produzir} unidades</strong></p>
                          </div>

                          {/* Formas */}
                          {sugestao.tem_rendimento ? (
                            <div className="space-y-0.5">
                              <p className="font-medium">🏭 Formas Necessárias:</p>
                              <p className="pl-4">
                                • {sugestao.quantidade_a_produzir} ÷ {sugestao.rendimento} un/forma = {(sugestao.quantidade_a_produzir / sugestao.rendimento!).toFixed(2)}
                              </p>
                              <p className="pl-4">• Arredondado: <strong>{sugestao.formas_sugeridas} formas</strong></p>
                              <p className="pl-4">
                                • Produzirá: <strong>{sugestao.formas_sugeridas * sugestao.rendimento!} unidades</strong>
                              </p>
                            </div>
                          ) : (
                            <p className="text-red-500 font-semibold">⚠️ Configure o rendimento em Precificação {'>'} Rendimentos</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
