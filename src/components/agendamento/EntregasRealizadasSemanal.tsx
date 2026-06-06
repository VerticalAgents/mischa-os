import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Package, Loader2, ChevronDown, ChevronUp, CheckCircle2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { Cliente } from "@/types";

interface EntregasRealizadasSemanelProps {
  semanaAtual: Date;
  representanteFiltro: number[];
  rotaFiltro: number[];
  clientes: Cliente[];
}
interface ProdutoQuantidade {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
}
export default function EntregasRealizadasSemanal({
  semanaAtual,
  representanteFiltro,
  rotaFiltro,
  clientes: clientesProp
}: EntregasRealizadasSemanelProps) {
  const [quantidadesPorProduto, setQuantidadesPorProduto] = useState<Record<string, ProdutoQuantidade>>({});
  const [quantidadeSemanaAnterior, setQuantidadeSemanaAnterior] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Calcular início e fim da semana atual e anterior
  const {
    inicioSemana,
    fimSemana,
    inicioSemanaAnterior,
    fimSemanaAnterior
  } = useMemo(() => {
    const semanaAnterior = subWeeks(semanaAtual, 1);
    return {
      inicioSemana: startOfWeek(semanaAtual, {
        weekStartsOn: 1
      }),
      fimSemana: endOfWeek(semanaAtual, {
        weekStartsOn: 1
      }),
      inicioSemanaAnterior: startOfWeek(semanaAnterior, {
        weekStartsOn: 1
      }),
      fimSemanaAnterior: endOfWeek(semanaAnterior, {
        weekStartsOn: 1
      })
    };
  }, [semanaAtual]);

  // Buscar entregas da semana atual e anterior
  useEffect(() => {
    const calcularQuantidades = async () => {
      setLoading(true);
      try {
        // Buscar entregas da semana atual
        const {
          data: entregas,
          error: entregasError
        } = await supabase.from('historico_entregas').select('id, quantidade, itens, cliente_id').eq('tipo', 'entrega').gte('data', inicioSemana.toISOString()).lte('data', fimSemana.toISOString());
        if (entregasError) throw entregasError;

        // Buscar entregas da semana anterior
        const {
          data: entregasAnterior,
          error: entregasAnteriorError
        } = await supabase.from('historico_entregas').select('id, quantidade, itens, cliente_id').eq('tipo', 'entrega').gte('data', inicioSemanaAnterior.toISOString()).lte('data', fimSemanaAnterior.toISOString());
        if (entregasAnteriorError) throw entregasAnteriorError;

        // Filtrar entregas por representante/rota usando clientes
        const filtrarPorRepresentanteRota = (entregasList: typeof entregas) => {
          if (!entregasList) return [];
          if (representanteFiltro.length === 0 && rotaFiltro.length === 0) return entregasList;
          
          // Se não há clientes carregados, não filtrar (evitar zerar dados)
          if (clientesProp.length === 0) return entregasList;
          
          const clienteIdsFiltrados = new Set(
            clientesProp
              .filter(c => {
                const matchRep = representanteFiltro.length === 0 || 
                  (c.representanteId && representanteFiltro.includes(c.representanteId));
                const matchRota = rotaFiltro.length === 0 || 
                  (c.rotaEntregaId && rotaFiltro.includes(c.rotaEntregaId));
                return matchRep && matchRota;
              })
              .map(c => c.id)
          );
          
          return entregasList.filter(e => clienteIdsFiltrados.has(e.cliente_id));
        };

        const entregasFiltradas = filtrarPorRepresentanteRota(entregas);
        const entregasAnteriorFiltradas = filtrarPorRepresentanteRota(entregasAnterior);

        // Buscar produtos para obter nomes
        const {
          data: produtos,
          error: produtosError
        } = await supabase.from('produtos_finais').select('id, nome').eq('ativo', true);
        if (produtosError) throw produtosError;

        // Criar mapa de produtos
        const produtosMap = new Map(produtos?.map(p => [p.id, p.nome]) || []);

        // Agregar quantidades por produto (semana atual)
        const quantidadesTemp: Record<string, ProdutoQuantidade> = {};
        entregasFiltradas.forEach(entrega => {
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

        // Calcular total da semana anterior
        let totalAnterior = 0;
        entregasAnteriorFiltradas.forEach(entrega => {
          if (!entrega.itens || !Array.isArray(entrega.itens)) return;
          entrega.itens.forEach((item: any) => {
            if (item.quantidade) {
              totalAnterior += item.quantidade;
            }
          });
        });
        setQuantidadeSemanaAnterior(totalAnterior);
      } catch (error) {
        console.error('Erro ao carregar entregas:', error);
        setQuantidadesPorProduto({});
        setQuantidadeSemanaAnterior(0);
      } finally {
        setLoading(false);
      }
    };
    calcularQuantidades();
  }, [inicioSemana, fimSemana, inicioSemanaAnterior, fimSemanaAnterior, representanteFiltro, rotaFiltro, clientesProp]);

  // Calcular totais, percentual e ordenar produtos
  const {
    quantidadeTotal,
    totalEntregas,
    produtosOrdenados,
    percentualEntregue
  } = useMemo(() => {
    const produtos = Object.values(quantidadesPorProduto);
    const total = produtos.reduce((acc, p) => acc + p.quantidade, 0);
    const ordenados = [...produtos].sort((a, b) => b.quantidade - a.quantidade);
    const percentual = quantidadeSemanaAnterior > 0 
      ? (total / quantidadeSemanaAnterior) * 100 
      : 0;
    return {
      quantidadeTotal: total,
      totalEntregas: produtos.length > 0 ? produtos.length : 0,
      produtosOrdenados: ordenados,
      percentualEntregue: percentual
    };
  }, [quantidadesPorProduto, quantidadeSemanaAnterior]);
  return <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 px-5 pt-5 pb-1">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Produtos Entregues
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Realizadas na semana selecionada</p>
        </div>
        {quantidadeSemanaAnterior > 0 && (
          <div className="flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Sem. anterior</span>
            <span className="text-sm font-semibold tabular-nums text-foreground">{quantidadeSemanaAnterior}</span>
            <TrendingUp className="h-3 w-3 text-emerald-600" />
            <span className="text-sm font-semibold tabular-nums text-emerald-600">
              {percentualEntregue.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      <CardContent className="pt-4">
        {loading ? <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div> : quantidadeTotal === 0 ? <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
            <Package className="h-4 w-4 opacity-50" />
            <p>Nenhuma entrega realizada nesta semana</p>
          </div> : (
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-1.5 min-w-0">
                <span className="text-4xl font-bold tabular-nums text-foreground leading-none">{quantidadeTotal}</span>
                <span className="text-sm text-muted-foreground">unidades</span>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {totalEntregas} {totalEntregas === 1 ? 'produto' : 'produtos'}
              </span>
            </div>
          )}
      </CardContent>
    </Card>;
}