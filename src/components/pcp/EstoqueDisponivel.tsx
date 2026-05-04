import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Package, Loader2, ChevronDown, ChevronUp, RefreshCw, AlertCircle, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { useEstoqueDisponivel } from "@/hooks/useEstoqueDisponivel";
import { useConfigStore } from "@/hooks/useConfigStore";
import { useMediaVendasSemanais } from "@/hooks/useMediaVendasSemanais";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
interface EstoqueDisponivelProps {
  quantidadesNecessarias?: Record<string, number>;
  ordemProdutosNecessarios?: string[];
  loadingNecessarios?: boolean;
  producaoAgendada?: Record<string, number>;
}
export default function EstoqueDisponivel({
  quantidadesNecessarias = {},
  ordemProdutosNecessarios = [],
  loadingNecessarios = false,
  producaoAgendada = {},
}: EstoqueDisponivelProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showSemPrevisao, setShowSemPrevisao] = useState(false);
  const { configuracoesProducao } = useConfigStore();
  const pctAlerta = Number((configuracoesProducao as any)?.estoqueAlertaCriticoPercentual ?? 30);
  const { mediaVendasPorProduto } = useMediaVendasSemanais();
  const {
    produtos,
    loading,
    error,
    totalDisponivel,
    totalSeparado,
    totalNecessario,
    recarregar
  } = useEstoqueDisponivel(quantidadesNecessarias);

  // Sempre aplicar produção agendada ao estoque disponível
  const produtosAjustados = useMemo(() => {
    if (Object.keys(producaoAgendada).length === 0) {
      return produtos;
    }
    return produtos.map(p => {
      const extra = producaoAgendada[p.produto_id] || 0;
      if (extra === 0) return p;
      const novoDisponivel = p.estoque_disponivel + extra;
      let status: 'critico' | 'baixo' | 'adequado' | 'excesso' = 'adequado';
      if (novoDisponivel < 0) status = 'critico';else if (novoDisponivel < p.estoque_minimo) status = 'baixo';else if (novoDisponivel > (p.estoque_ideal || p.estoque_minimo)) status = 'excesso';
      return {
        ...p,
        estoque_disponivel: novoDisponivel,
        status
      };
    });
  }, [produtos, producaoAgendada]);
  const totalDisponivelAjustado = useMemo(() => {
    return produtosAjustados.reduce((sum, p) => sum + p.estoque_disponivel, 0);
  }, [produtosAjustados]);
  // Alvo semanal calculado a partir do Setup PCP (mesma lógica do SetupPCPTab).
  // Fallback: soma dos estoque_ideal cadastrados nos produtos.
  const alvoSemanal = useMemo(() => {
    const cfg: any = configuracoesProducao || {};
    const modo: "fixo" | "percentual" | "cobertura" = cfg.estoqueAlvoModo ?? "cobertura";
    const mediaTotal = Object.values(mediaVendasPorProduto).reduce(
      (sum: number, v) => sum + (Number(v) || 0),
      0
    );
    let calculado = 0;
    if (modo === "fixo") {
      const fixos: Record<string, number> = cfg.estoqueAlvoFixoPorProduto || {};
      calculado = Object.values(fixos).reduce((sum, v) => sum + (Number(v) || 0), 0);
    } else if (modo === "percentual") {
      const pct = Number(cfg.estoqueAlvoPercentual ?? 20);
      calculado = Math.round((mediaTotal * pct) / 100);
    } else {
      const dias = Number(cfg.estoqueAlvoCoberturaDias ?? cfg.coberturaAlvoDias ?? 3);
      calculado = Math.round((mediaTotal * dias) / 7);
    }
    if (calculado > 0) return calculado;
    return produtosAjustados.reduce(
      (sum, p) => sum + (Number(p.estoque_ideal) || 0),
      0
    );
  }, [configuracoesProducao, mediaVendasPorProduto, produtosAjustados]);

  // Cor condicional: vermelho < 0, laranja entre 0 e X% do alvo, amarelo abaixo do alvo, azul ≥ alvo
  const limiteAlerta = alvoSemanal * (pctAlerta / 100);
  const emAlerta =
    alvoSemanal > 0 &&
    totalDisponivelAjustado >= 0 &&
    totalDisponivelAjustado < limiteAlerta;
  const blockClass =
    totalDisponivelAjustado < 0
      ? "bg-red-500/10 dark:bg-red-500/20 border-red-500/30"
      : emAlerta
      ? "bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/30"
      : alvoSemanal > 0 && totalDisponivelAjustado < alvoSemanal
      ? "bg-yellow-500/10 dark:bg-yellow-500/20 border-yellow-500/30"
      : "bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30";
  const totalTextClass =
    totalDisponivelAjustado < 0
      ? "text-red-600 dark:text-red-400"
      : emAlerta
      ? "text-orange-600 dark:text-orange-400"
      : alvoSemanal > 0 && totalDisponivelAjustado < alvoSemanal
      ? "text-yellow-700 dark:text-yellow-400"
      : "text-blue-600 dark:text-blue-400";

  // Resumo de status por produto (sempre visível, mesmo com detalhes colapsados)
  const resumoStatus = useMemo(() => {
    const r = { critico: 0, baixo: 0, adequado: 0, excesso: 0 };
    for (const p of produtosAjustados) {
      r[p.status] = (r[p.status] || 0) + 1;
    }
    return r;
  }, [produtosAjustados]);
  const produtosComPrevisao = useMemo(() => {
    const comPrevisao = produtosAjustados.filter(p => p.quantidade_necessaria > 0);
    return comPrevisao.sort((a, b) => {
      const indexA = ordemProdutosNecessarios.indexOf(a.produto_id);
      const indexB = ordemProdutosNecessarios.indexOf(b.produto_id);

      // Se ambos estão na lista, usar a ordem da lista
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      // Se apenas A está na lista, A vem primeiro
      if (indexA !== -1) return -1;

      // Se apenas B está na lista, B vem primeiro
      if (indexB !== -1) return 1;

      // Se nenhum está na lista, manter ordem atual
      return 0;
    });
  }, [produtosAjustados, ordemProdutosNecessarios]);
  const produtosSemPrevisao = useMemo(() => {
    return produtosAjustados.filter(p => p.quantidade_necessaria === 0);
  }, [produtosAjustados]);
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critico':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'baixo':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'excesso':
        return <TrendingUp className="h-4 w-4 text-yellow-600" />;
      default:
        return <Package className="h-4 w-4 text-green-600" />;
    }
  };
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'critico':
        return 'bg-red-600 text-white border-red-600';
      case 'baixo':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      case 'excesso':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
    }
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'critico':
        return 'Crítico';
      case 'baixo':
        return 'Baixo';
      case 'excesso':
        return 'Excesso';
      default:
        return 'Adequado';
    }
  };
  return <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Estoque Disponível</CardTitle>
          <CardDescription className="text-left">
            Saldo atual + produção agendada − expedição
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center justify-end gap-2 pb-3 mb-3 border-b min-h-[2.25rem]">
          <Button variant="ghost" size="icon" onClick={recarregar} disabled={loading} title="Atualizar" className="h-8 w-8">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {error ? <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar dados de estoque. 
              <Button variant="link" onClick={recarregar} className="p-0 h-auto ml-1">
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert> : loading || loadingNecessarios ? <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              {loadingNecessarios ? 'Carregando estoque...' : 'Calculando estoque...'}
            </span>
          </div> : produtos.length === 0 ? <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhum produto cadastrado</p>
          </div> : <div className="space-y-4">
            {/* Total Geral */}
            <div className={`p-4 rounded-lg border text-center ${blockClass}`}>
              <p className="text-sm text-muted-foreground mb-1">Estoque Total Disponível</p>
              <p className={`text-3xl font-bold ${totalTextClass}`}>
                {totalDisponivelAjustado}
              </p>
              {emAlerta && (
                <div className="flex items-center justify-center gap-1.5 mt-2 text-orange-700 dark:text-orange-400 text-xs font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>
                    Estoque abaixo de {pctAlerta}% do alvo ({alvoSemanal})
                  </span>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="default">
                  {produtos.length} {produtos.length === 1 ? 'produto' : 'produtos'}
                </Badge>
                {totalSeparado > 0 && <Badge variant="outline">
                    {totalSeparado} separados
                  </Badge>}
                {totalNecessario > 0 && <Badge variant="outline">
                    {totalNecessario} necessários
                  </Badge>}
              </div>
              {(resumoStatus.critico > 0 || resumoStatus.baixo > 0 || resumoStatus.excesso > 0) && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                  {resumoStatus.critico > 0 && (
                    <Badge variant="outline" className="text-xs border bg-red-600 text-white border-red-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {resumoStatus.critico} crítico{resumoStatus.critico > 1 ? "s" : ""}
                    </Badge>
                  )}
                  {resumoStatus.baixo > 0 && (
                    <Badge variant="outline" className="text-xs border bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      {resumoStatus.baixo} baixo{resumoStatus.baixo > 1 ? "s" : ""}
                    </Badge>
                  )}
                  {resumoStatus.excesso > 0 && (
                    <Badge variant="outline" className="text-xs border bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {resumoStatus.excesso} em excesso
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Produtos Individuais - Collapsible */}
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
                {/* Produtos COM previsão - sempre visíveis */}
                {produtosComPrevisao.map(produto => <TooltipProvider key={produto.produto_id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3 text-left">
                            {getStatusIcon(produto.status)}
                            <div>
                              <span className="font-medium">{produto.produto_nome}</span>
                              <p className="text-xs text-muted-foreground mt-0.5 text-left">
                                Saldo: {produto.saldo_atual} | Separado: {produto.quantidade_separada}
                                {(producaoAgendada[produto.produto_id] || 0) > 0 && ` | Agendado: ${producaoAgendada[produto.produto_id]}`}
                                {produto.quantidade_necessaria > 0 && ` | Necessário: ${produto.quantidade_necessaria}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="secondary" className="text-base px-3 py-1">
                              {produto.estoque_disponivel}
                            </Badge>
                            <Badge variant="outline" className={`text-xs border ${getStatusBadgeVariant(produto.status)}`}>
                              {getStatusLabel(produto.status)}
                            </Badge>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs space-y-1">
                          <p><strong>Mínimo:</strong> {produto.estoque_minimo}</p>
                          <p><strong>Ideal:</strong> {produto.estoque_ideal}</p>
                          <p><strong>Disponível:</strong> {produto.estoque_disponivel}</p>
                          {produto.status === 'critico' && <p className="text-red-500 font-semibold">⚠️ Estoque insuficiente!</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>)}

                {/* Produtos SEM previsão - collapsible */}
                {produtosSemPrevisao.length > 0 && <div className="mt-4 pt-4 border-t">
                    <Button variant="ghost" size="sm" className="w-full flex items-center justify-between text-muted-foreground hover:text-foreground mb-2" onClick={() => setShowSemPrevisao(!showSemPrevisao)}>
                      <span className="text-xs">
                        Outros produtos ({produtosSemPrevisao.length})
                      </span>
                      {showSemPrevisao ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                    
                    {showSemPrevisao && <div className="space-y-2">
                        {produtosSemPrevisao.map(produto => <TooltipProvider key={produto.produto_id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center gap-3 text-left">
                                    {getStatusIcon(produto.status)}
                                    <div>
                                      <span className="font-medium">{produto.produto_nome}</span>
                                      <p className="text-xs text-muted-foreground mt-0.5 text-left">
                                        Saldo: {produto.saldo_atual} | Separado: {produto.quantidade_separada}
                                        {(producaoAgendada[produto.produto_id] || 0) > 0 && ` | Agendado: ${producaoAgendada[produto.produto_id]}`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <Badge variant="secondary" className="text-base px-3 py-1">
                                      {produto.estoque_disponivel}
                                    </Badge>
                                    <Badge variant="outline" className={`text-xs border ${getStatusBadgeVariant(produto.status)}`}>
                                      {getStatusLabel(produto.status)}
                                    </Badge>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs space-y-1">
                                  <p><strong>Mínimo:</strong> {produto.estoque_minimo}</p>
                                  <p><strong>Ideal:</strong> {produto.estoque_ideal}</p>
                                  <p><strong>Disponível:</strong> {produto.estoque_disponivel}</p>
                                  {produto.status === 'critico' && <p className="text-red-500 font-semibold">⚠️ Estoque insuficiente!</p>}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>)}
                      </div>}
                  </div>}
              </CollapsibleContent>
            </Collapsible>
          </div>}
      </CardContent>
    </Card>;
}