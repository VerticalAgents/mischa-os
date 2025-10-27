import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Package, Loader2, ChevronDown, ChevronUp, RefreshCw, AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { useEstoqueDisponivel } from "@/hooks/useEstoqueDisponivel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EstoqueDisponivelProps {
  quantidadesNecessarias?: Record<string, number>;
}

export default function EstoqueDisponivel({ quantidadesNecessarias = {} }: EstoqueDisponivelProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showSemPrevisao, setShowSemPrevisao] = useState(false);
  const { 
    produtos, 
    loading, 
    error, 
    totalDisponivel, 
    totalSeparado,
    totalNecessario,
    recarregar 
  } = useEstoqueDisponivel(quantidadesNecessarias);

  // Separar produtos com e sem previsão
  const produtosComPrevisao = useMemo(() => {
    return produtos.filter(p => p.quantidade_necessaria > 0);
  }, [produtos]);

  const produtosSemPrevisao = useMemo(() => {
    return produtos.filter(p => p.quantidade_necessaria === 0);
  }, [produtos]);

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Estoque Disponível
            </CardTitle>
            <CardDescription className="text-left">
              Saldo atual menos quantidades em expedição
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={recarregar}
            disabled={loading}
            title="Atualizar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar dados de estoque. 
              <Button variant="link" onClick={recarregar} className="p-0 h-auto ml-1">
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Calculando estoque...</span>
          </div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhum produto cadastrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total Geral */}
            <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border border-primary/20 text-center">
              <p className="text-sm text-muted-foreground mb-1">Estoque Total Disponível</p>
              <p className={`text-3xl font-bold ${totalDisponivel < 0 ? 'text-red-500' : 'text-primary'}`}>
                {totalDisponivel}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="default">
                  {produtos.length} {produtos.length === 1 ? 'produto' : 'produtos'}
                </Badge>
                {totalSeparado > 0 && (
                  <Badge variant="outline">
                    {totalSeparado} separados
                  </Badge>
                )}
                {totalNecessario > 0 && (
                  <Badge variant="outline">
                    {totalNecessario} necessários
                  </Badge>
                )}
              </div>
            </div>

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
                {/* Produtos COM previsão - sempre visíveis */}
                {produtosComPrevisao.map((produto) => (
                  <TooltipProvider key={produto.produto_id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3 text-left">
                            {getStatusIcon(produto.status)}
                            <div>
                              <span className="font-medium">{produto.produto_nome}</span>
                              <p className="text-xs text-muted-foreground mt-0.5 text-left">
                                Saldo: {produto.saldo_atual} | Separado: {produto.quantidade_separada}
                                {produto.quantidade_necessaria > 0 && ` | Necessário: ${produto.quantidade_necessaria}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge 
                              variant="secondary"
                              className="text-base px-3 py-1"
                            >
                              {produto.estoque_disponivel}
                            </Badge>
                            <Badge 
                              variant="outline"
                              className={`text-xs border ${getStatusBadgeVariant(produto.status)}`}
                            >
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
                          {produto.status === 'critico' && (
                            <p className="text-red-500 font-semibold">⚠️ Estoque insuficiente!</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}

                {/* Produtos SEM previsão - collapsible */}
                {produtosSemPrevisao.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full flex items-center justify-between text-muted-foreground hover:text-foreground mb-2"
                      onClick={() => setShowSemPrevisao(!showSemPrevisao)}
                    >
                      <span className="text-xs">
                        Outros produtos ({produtosSemPrevisao.length})
                      </span>
                      {showSemPrevisao ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                    
                    {showSemPrevisao && (
                      <div className="space-y-2">
                        {produtosSemPrevisao.map((produto) => (
                          <TooltipProvider key={produto.produto_id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center gap-3 text-left">
                                    {getStatusIcon(produto.status)}
                                    <div>
                                      <span className="font-medium">{produto.produto_nome}</span>
                                      <p className="text-xs text-muted-foreground mt-0.5 text-left">
                                        Saldo: {produto.saldo_atual} | Separado: {produto.quantidade_separada}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <Badge 
                                      variant="secondary"
                                      className="text-base px-3 py-1"
                                    >
                                      {produto.estoque_disponivel}
                                    </Badge>
                                    <Badge 
                                      variant="outline"
                                      className={`text-xs border ${getStatusBadgeVariant(produto.status)}`}
                                    >
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
                                  {produto.status === 'critico' && (
                                    <p className="text-red-500 font-semibold">⚠️ Estoque insuficiente!</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
