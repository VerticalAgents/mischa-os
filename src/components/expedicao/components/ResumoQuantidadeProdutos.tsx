import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useProporoesPadrao } from "@/hooks/useProporoesPadrao";
import { useEstoqueProdutos } from "@/hooks/useEstoqueProdutos";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { Package, AlertTriangle, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface ResumoQuantidadeProdutosProps {
  pedidos: any[];
  className?: string;
}

export const ResumoQuantidadeProdutos = ({
  pedidos,
  className = ""
}: ResumoQuantidadeProdutosProps) => {
  const { calcularQuantidadesPorProporcao } = useProporoesPadrao();
  const { produtos, loading: loadingEstoque, obterProdutoPorNome } = useEstoqueProdutos();
  const { pedidos: todosPedidos } = useExpedicaoStore();

  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [quantidadesTotais, setQuantidadesTotais] = React.useState<{ [nome: string]: number }>({});
  const [quantidadesSeparadas, setQuantidadesSeparadas] = React.useState<{ [nome: string]: number }>({});
  const [calculando, setCalculando] = React.useState(true);

  // Calcular quantidades por produto
  const calcularQuantidadesTotais = async () => {
    const quantidadesPorProduto: { [nome: string]: number } = {};
    for (const pedido of pedidos) {
      if (pedido.tipo_pedido === 'Alterado' && pedido.itens_personalizados?.length > 0) {
        pedido.itens_personalizados.forEach((item: any) => {
          const nomeProduto = item.produto || item.nome || 'Produto desconhecido';
          quantidadesPorProduto[nomeProduto] = (quantidadesPorProduto[nomeProduto] || 0) + item.quantidade;
        });
      } else {
        try {
          const quantidadesProporcao = await calcularQuantidadesPorProporcao(pedido.quantidade_total);
          quantidadesProporcao.forEach(item => {
            quantidadesPorProduto[item.produto] = (quantidadesPorProduto[item.produto] || 0) + item.quantidade;
          });
        } catch (error) {
          console.warn('Erro ao calcular proporções para pedido:', pedido.id, error);
          const produtosAtivos = produtos.filter(p => p.ativo);
          if (produtosAtivos.length > 0) {
            const quantidadePorProduto = Math.floor(pedido.quantidade_total / produtosAtivos.length);
            const resto = pedido.quantidade_total % produtosAtivos.length;
            produtosAtivos.forEach((produto, index) => {
              const quantidade = quantidadePorProduto + (index < resto ? 1 : 0);
              quantidadesPorProduto[produto.nome] = (quantidadesPorProduto[produto.nome] || 0) + quantidade;
            });
          }
        }
      }
    }
    return quantidadesPorProduto;
  };

  // Calcular quantidades separadas (pedidos separados + despachados)
  const calcularQuantidadesSeparadas = async () => {
    const quantidadesSeparadas: { [nome: string]: number } = {};
    const pedidosSeparados = todosPedidos.filter(pedido => 
      pedido.substatus_pedido === 'Separado' || pedido.substatus_pedido === 'Despachado'
    );
    for (const pedido of pedidosSeparados) {
      if (pedido.tipo_pedido === 'Alterado' && pedido.itens_personalizados?.length > 0) {
        pedido.itens_personalizados.forEach((item: any) => {
          const nomeProduto = item.produto || item.nome || 'Produto desconhecido';
          quantidadesSeparadas[nomeProduto] = (quantidadesSeparadas[nomeProduto] || 0) + item.quantidade;
        });
      } else {
        try {
          const quantidadesProporcao = await calcularQuantidadesPorProporcao(pedido.quantidade_total);
          quantidadesProporcao.forEach(item => {
            quantidadesSeparadas[item.produto] = (quantidadesSeparadas[item.produto] || 0) + item.quantidade;
          });
        } catch (error) {
          console.warn('Erro ao calcular proporções para pedido separado:', pedido.id, error);
          const produtosAtivos = produtos.filter(p => p.ativo);
          if (produtosAtivos.length > 0) {
            const quantidadePorProduto = Math.floor(pedido.quantidade_total / produtosAtivos.length);
            const resto = pedido.quantidade_total % produtosAtivos.length;
            produtosAtivos.forEach((produto, index) => {
              const quantidade = quantidadePorProduto + (index < resto ? 1 : 0);
              quantidadesSeparadas[produto.nome] = (quantidadesSeparadas[produto.nome] || 0) + quantidade;
            });
          }
        }
      }
    }
    return quantidadesSeparadas;
  };

  React.useEffect(() => {
    const carregarQuantidades = async () => {
      if (loadingEstoque) return;
      setCalculando(true);
      try {
        const [quantidades, quantidadesSep] = await Promise.all([
          calcularQuantidadesTotais(), 
          calcularQuantidadesSeparadas()
        ]);
        setQuantidadesTotais(quantidades);
        setQuantidadesSeparadas(quantidadesSep);
      } catch (error) {
        console.error('Erro ao calcular quantidades:', error);
      } finally {
        setCalculando(false);
      }
    };
    carregarQuantidades();
  }, [pedidos, loadingEstoque, produtos, todosPedidos]);

  // Verificar estoque disponível para cada produto
  const verificarEstoque = (nomeProduto: string, quantidadeNecessaria: number, quantidadeSeparada: number) => {
    const produto = obterProdutoPorNome(nomeProduto);
    if (!produto) return { temEstoque: false, estoqueDisponivel: 0 };
    const estoqueAtual = produto.estoque_atual || 0;
    const estoqueDisponivel = estoqueAtual - quantidadeSeparada;
    return {
      temEstoque: estoqueDisponivel >= quantidadeNecessaria,
      estoqueDisponivel: Math.max(0, estoqueDisponivel)
    };
  };

  const totalGeral = Object.values(quantidadesTotais).reduce((sum, qty) => sum + qty, 0);
  const produtosComQuantidade = Object.entries(quantidadesTotais)
    .filter(([_, qty]) => qty > 0)
    .sort((a, b) => b[1] - a[1]); // Ordenar por quantidade desc

  const produtosSemEstoque = produtosComQuantidade.filter(([nomeProduto, quantidade]) => {
    const quantidadeSeparada = quantidadesSeparadas[nomeProduto] || 0;
    const { temEstoque } = verificarEstoque(nomeProduto, quantidade, quantidadeSeparada);
    return !temEstoque;
  });

  // Loading state
  if (loadingEstoque || calculando) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Produtos Necessários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Calculando quantidades...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (produtosComQuantidade.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Produtos Necessários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhum pedido para separação</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Produtos Necessários
            </CardTitle>
            <CardDescription className="text-left">
              Quantidades para pedidos agendados
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Geral */}
          <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">Quantidade Total Necessária</p>
            <p className="text-3xl font-bold text-primary">{totalGeral}</p>
            <Badge variant="default" className="mt-2">
              {pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'}
            </Badge>
          </div>

          {/* Alerta de estoque insuficiente */}
          {produtosSemEstoque.length > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                <AlertTriangle className="h-4 w-4" />
                {produtosSemEstoque.length === 1 
                  ? `${produtosSemEstoque[0][0]} sem estoque suficiente`
                  : `${produtosSemEstoque.length} produtos sem estoque suficiente`}
              </div>
            </div>
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
              {produtosComQuantidade.map(([nomeProduto, quantidade]) => {
                const quantidadeSeparada = quantidadesSeparadas[nomeProduto] || 0;
                const { temEstoque, estoqueDisponivel } = verificarEstoque(nomeProduto, quantidade, quantidadeSeparada);
                
                return (
                  <div 
                    key={nomeProduto}
                    className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                      temEstoque 
                        ? 'hover:bg-muted/50' 
                        : 'bg-destructive/5 border-destructive/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Package className={`h-4 w-4 ${temEstoque ? 'text-muted-foreground' : 'text-destructive'}`} />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{nomeProduto}</span>
                        <span className="text-xs text-muted-foreground">
                          Estoque: {estoqueDisponivel} | Separado: {quantidadeSeparada}
                        </span>
                      </div>
                    </div>
                    <Badge 
                      variant={temEstoque ? "secondary" : "destructive"} 
                      className="text-base px-3 py-1"
                    >
                      {quantidade}
                    </Badge>
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
};
