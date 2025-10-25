import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, RefreshCw, Package, AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { useEstoqueDisponivel } from "@/hooks/useEstoqueDisponivel";

interface EstoqueDisponivelProps {
  className?: string;
}

export function EstoqueDisponivel({ className }: EstoqueDisponivelProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { 
    produtos, 
    loading, 
    error,
    totalDisponivel,
    totalSeparado,
    totalDespachado,
    recarregar 
  } = useEstoqueDisponivel();

  const getStatusColor = (produto: typeof produtos[0]) => {
    if (produto.estoque_disponivel <= 0) return "text-destructive";
    if (produto.estoque_disponivel < produto.estoque_minimo) return "text-yellow-600 dark:text-yellow-500";
    if (produto.estoque_disponivel >= produto.estoque_ideal) return "text-green-600 dark:text-green-500";
    return "text-muted-foreground";
  };

  const getStatusIcon = (produto: typeof produtos[0]) => {
    if (produto.estoque_disponivel <= 0) return <AlertCircle className="h-4 w-4" />;
    if (produto.estoque_disponivel < produto.estoque_minimo) return <TrendingDown className="h-4 w-4" />;
    if (produto.estoque_disponivel >= produto.estoque_ideal) return <TrendingUp className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Estoque Disponível</CardTitle>
            <CardDescription>
              Saldo atual menos quantidades em expedição
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={recarregar}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Calculando estoque...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <p className="text-sm">Erro ao carregar estoque</p>
            </div>
          </div>
        )}

        {!loading && !error && produtos.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Nenhum produto encontrado</p>
          </div>
        )}

        {!loading && !error && produtos.length > 0 && (
          <>
            <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Disponível:</span>
                <span className={`text-2xl font-bold ${
                  totalDisponivel <= 0 
                    ? 'text-destructive' 
                    : totalDisponivel < 100 
                    ? 'text-yellow-600 dark:text-yellow-500' 
                    : 'text-foreground'
                }`}>
                  {totalDisponivel}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Separados:</span>
                <span className="font-medium text-orange-600 dark:text-orange-500">
                  {totalSeparado}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Despachados:</span>
                <span className="font-medium text-blue-600 dark:text-blue-500">
                  {totalDespachado}
                </span>
              </div>
            </div>

            <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="text-sm font-medium">
                    Ver detalhes por produto ({produtos.length})
                  </span>
                  {isDetailsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-2 pt-2">
                {produtos.map((produto) => (
                  <div
                    key={produto.produto_id}
                    className="flex items-center justify-between rounded-md border bg-card p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={getStatusColor(produto)}>
                        {getStatusIcon(produto)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {produto.produto_nome}
                        </p>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>Saldo: {produto.saldo_atual}</span>
                          <span className="text-orange-600 dark:text-orange-500">
                            Sep: {produto.quantidade_separada}
                          </span>
                          <span className="text-blue-600 dark:text-blue-500">
                            Desp: {produto.quantidade_despachada}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className={`text-lg font-bold ${getStatusColor(produto)}`}>
                        {produto.estoque_disponivel}
                      </p>
                      {produto.estoque_minimo > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Mín: {produto.estoque_minimo}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>
    </Card>
  );
}
