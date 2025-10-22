import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Package, Loader2, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek } from "date-fns";

interface EntregasRealizadasSemanelProps {
  semanaAtual: Date;
}

interface ProdutoQuantidade {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
}

export default function EntregasRealizadasSemanal({ semanaAtual }: EntregasRealizadasSemanelProps) {
  const [quantidadesPorProduto, setQuantidadesPorProduto] = useState<Record<string, ProdutoQuantidade>>({});
  const [loading, setLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Calcular início e fim da semana
  const { inicioSemana, fimSemana } = useMemo(() => {
    return {
      inicioSemana: startOfWeek(semanaAtual, { weekStartsOn: 1 }),
      fimSemana: endOfWeek(semanaAtual, { weekStartsOn: 1 })
    };
  }, [semanaAtual]);

  // Buscar entregas da semana e calcular quantidades
  useEffect(() => {
    const calcularQuantidades = async () => {
      setLoading(true);
      try {
        // Buscar entregas da semana
        const { data: entregas, error: entregasError } = await supabase
          .from('historico_entregas')
          .select('id, quantidade, itens')
          .eq('tipo', 'entrega')
          .gte('data', inicioSemana.toISOString())
          .lte('data', fimSemana.toISOString());

        if (entregasError) throw entregasError;

        // Buscar produtos para obter nomes
        const { data: produtos, error: produtosError } = await supabase
          .from('produtos_finais')
          .select('id, nome')
          .eq('ativo', true);

        if (produtosError) throw produtosError;

        // Criar mapa de produtos
        const produtosMap = new Map(produtos?.map(p => [p.id, p.nome]) || []);

        // Agregar quantidades por produto
        const quantidadesTemp: Record<string, ProdutoQuantidade> = {};

        entregas?.forEach(entrega => {
          if (!entrega.itens || !Array.isArray(entrega.itens)) {
            console.warn('Entrega sem itens válidos:', entrega.id);
            return;
          }

          entrega.itens.forEach((item: any) => {
            if (!item.produto_id || !item.quantidade) {
              console.warn('Item inválido na entrega:', entrega.id, item);
              return;
            }

            const produtoId = item.produto_id;
            const quantidade = item.quantidade;
            const produtoNome = produtosMap.get(produtoId) || `Produto ${produtoId.slice(0, 8)}...`;

            if (quantidadesTemp[produtoId]) {
              quantidadesTemp[produtoId].quantidade += quantidade;
            } else {
              quantidadesTemp[produtoId] = {
                produto_id: produtoId,
                produto_nome: produtoNome,
                quantidade: quantidade
              };
            }
          });
        });

        setQuantidadesPorProduto(quantidadesTemp);
      } catch (error) {
        console.error('Erro ao carregar entregas:', error);
        setQuantidadesPorProduto({});
      } finally {
        setLoading(false);
      }
    };

    calcularQuantidades();
  }, [inicioSemana, fimSemana]);

  // Calcular totais e ordenar produtos
  const { quantidadeTotal, totalEntregas, produtosOrdenados } = useMemo(() => {
    const produtos = Object.values(quantidadesPorProduto);
    const total = produtos.reduce((acc, p) => acc + p.quantidade, 0);
    const ordenados = [...produtos].sort((a, b) => b.quantidade - a.quantidade);

    return {
      quantidadeTotal: total,
      totalEntregas: produtos.length > 0 ? produtos.length : 0,
      produtosOrdenados: ordenados
    };
  }, [quantidadesPorProduto]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Entregas Realizadas da Semana
        </CardTitle>
        <CardDescription>
          Resumo das entregas já concluídas nesta semana
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : quantidadeTotal === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma entrega realizada nesta semana</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total Geral */}
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-muted-foreground mb-1">Quantidade Total Entregue</p>
              <p className="text-3xl font-bold text-green-600">{quantidadeTotal}</p>
              <Badge variant="default" className="mt-2 bg-green-600 hover:bg-green-700">
                {totalEntregas} {totalEntregas === 1 ? 'produto' : 'produtos'}
              </Badge>
            </div>

            {/* Detalhes por Produto - Collapsible */}
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
                {produtosOrdenados.map((produto) => (
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
  );
}
