import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Factory, Loader2, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRendimentosReceitaProduto } from "@/hooks/useRendimentosReceitaProduto";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

interface ProdutoQuantidade {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
}

interface SugestaoProducaoProps {
  produtosNecessarios: ProdutoQuantidade[];
  loading?: boolean;
}

interface SugestaoProducaoProduto {
  produto_id: string;
  produto_nome: string;
  quantidade_necessaria: number;
  rendimento: number | null;
  formas_sugeridas: number;
  tem_rendimento: boolean;
}

export default function SugestaoProducao({ produtosNecessarios, loading = false }: SugestaoProducaoProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { obterRendimentoPorProduto, loading: loadingRendimentos } = useRendimentosReceitaProduto();

  // Calcular sugestões de produção
  const sugestoesProducao = useMemo((): SugestaoProducaoProduto[] => {
    if (loadingRendimentos || loading) return [];

    return produtosNecessarios.map(produto => {
      const rendimentoInfo = obterRendimentoPorProduto(produto.produto_id);
      const rendimento = rendimentoInfo?.rendimento || null;
      const tem_rendimento = !!rendimento && rendimento > 0;
      
      // Calcular formas necessárias: quantidade necessária / rendimento
      const formas_sugeridas = tem_rendimento 
        ? Math.ceil(produto.quantidade / rendimento) 
        : 0;

      return {
        produto_id: produto.produto_id,
        produto_nome: produto.produto_nome,
        quantidade_necessaria: produto.quantidade,
        rendimento,
        formas_sugeridas,
        tem_rendimento
      };
    });
  }, [produtosNecessarios, obterRendimentoPorProduto, loadingRendimentos, loading]);

  // Calcular totais
  const totalFormas = useMemo(() => {
    return sugestoesProducao.reduce((sum, s) => sum + s.formas_sugeridas, 0);
  }, [sugestoesProducao]);

  const totalProdutosComRendimento = useMemo(() => {
    return sugestoesProducao.filter(s => s.tem_rendimento).length;
  }, [sugestoesProducao]);

  const totalProdutosSemRendimento = useMemo(() => {
    return sugestoesProducao.filter(s => !s.tem_rendimento).length;
  }, [sugestoesProducao]);

  const isLoading = loading || loadingRendimentos;

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
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Calculando sugestões...</span>
          </div>
        ) : produtosNecessarios.length === 0 ? (
          <div className="text-center py-8">
            <Factory className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhum produto necessário nesta semana</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total Geral */}
            <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border border-primary/20 text-center">
              <p className="text-sm text-muted-foreground mb-1">Total de Formas a Produzir</p>
              <p className="text-3xl font-bold text-primary">{totalFormas}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="default">
                  {totalProdutosComRendimento} {totalProdutosComRendimento === 1 ? 'produto' : 'produtos'}
                </Badge>
                {totalProdutosSemRendimento > 0 && (
                  <Badge variant="destructive">
                    {totalProdutosSemRendimento} sem rendimento
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
                {sugestoesProducao.map((sugestao) => (
                  <TooltipProvider key={sugestao.produto_id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3 text-left">
                            <Factory className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="font-medium">{sugestao.produto_nome}</span>
                              <p className="text-xs text-muted-foreground mt-0.5 text-left">
                                Necessário: {sugestao.quantidade_necessaria} unidades
                                {sugestao.tem_rendimento && ` | Rendimento: ${sugestao.rendimento}/forma`}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge 
                              variant={sugestao.tem_rendimento ? "default" : "destructive"}
                              className="text-base px-3 py-1"
                            >
                              {sugestao.tem_rendimento ? `${sugestao.formas_sugeridas} formas` : '—'}
                            </Badge>
                            {!sugestao.tem_rendimento && (
                              <Badge variant="outline" className="text-xs border bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
                                Sem rendimento
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs space-y-1">
                          <p><strong>Quantidade necessária:</strong> {sugestao.quantidade_necessaria} unidades</p>
                          {sugestao.tem_rendimento ? (
                            <>
                              <p><strong>Rendimento:</strong> {sugestao.rendimento} unidades/forma</p>
                              <p><strong>Cálculo:</strong> {sugestao.quantidade_necessaria} ÷ {sugestao.rendimento} = {sugestao.formas_sugeridas} formas</p>
                              <p className="text-green-600 dark:text-green-400">✓ Rendimento configurado</p>
                            </>
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
