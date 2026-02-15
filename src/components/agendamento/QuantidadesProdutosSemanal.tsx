import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Package, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek } from "date-fns";

interface QuantidadesProdutosSemanelProps {
  agendamentosFiltrados: any[];
  semanaAtual: Date;
  incluirPrevistos: boolean;
  percentualPrevistos: number;
}

interface ProdutoQuantidade {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
}

export default function QuantidadesProdutosSemanal({
  agendamentosFiltrados,
  semanaAtual,
  incluirPrevistos,
  percentualPrevistos
}: QuantidadesProdutosSemanelProps) {
  const [quantidadesPorProdutoConfirmados, setQuantidadesPorProdutoConfirmados] = useState<Record<string, ProdutoQuantidade>>({});
  const [quantidadesPorProdutoPrevistos, setQuantidadesPorProdutoPrevistos] = useState<Record<string, ProdutoQuantidade>>({});
  const [loading, setLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const agendamentosConfirmadosSemana = useMemo(() => {
    const inicioSemana = startOfWeek(semanaAtual, { weekStartsOn: 1 });
    const fimSemana = endOfWeek(semanaAtual, { weekStartsOn: 1 });
    return agendamentosFiltrados.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.dataReposicao);
      return dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana && agendamento.statusAgendamento === "Agendado";
    });
  }, [agendamentosFiltrados, semanaAtual]);

  const agendamentosPrevistosSemana = useMemo(() => {
    const inicioSemana = startOfWeek(semanaAtual, { weekStartsOn: 1 });
    const fimSemana = endOfWeek(semanaAtual, { weekStartsOn: 1 });
    return agendamentosFiltrados.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.dataReposicao);
      return dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana && agendamento.statusAgendamento === "Previsto";
    });
  }, [agendamentosFiltrados, semanaAtual]);

  // Fetch product quantities from RPC
  const fetchQuantidades = async (agendamentos: any[]) => {
    const quantidadesTemp: Record<string, ProdutoQuantidade> = {};
    for (const agendamento of agendamentos) {
      if (!agendamento.id) continue;
      try {
        const { data, error } = await supabase.rpc('compute_entrega_itens_v2', {
          p_agendamento_id: agendamento.id
        });
        if (error) continue;
        if (data && Array.isArray(data)) {
          data.forEach((item: any) => {
            const produtoId = item.produto_id;
            if (quantidadesTemp[produtoId]) {
              quantidadesTemp[produtoId].quantidade += item.quantidade;
            } else {
              quantidadesTemp[produtoId] = {
                produto_id: produtoId,
                produto_nome: item.produto_nome,
                quantidade: item.quantidade
              };
            }
          });
        }
      } catch (error) {
        // skip
      }
    }
    return quantidadesTemp;
  };

  useEffect(() => {
    const calcular = async () => {
      setLoading(true);
      try {
        const [confirmados, previstos] = await Promise.all([
          agendamentosConfirmadosSemana.length > 0 ? fetchQuantidades(agendamentosConfirmadosSemana) : Promise.resolve({}),
          agendamentosPrevistosSemana.length > 0 ? fetchQuantidades(agendamentosPrevistosSemana) : Promise.resolve({})
        ]);
        setQuantidadesPorProdutoConfirmados(confirmados);
        setQuantidadesPorProdutoPrevistos(previstos);
      } catch (error) {
        console.error('Erro ao calcular quantidades:', error);
      } finally {
        setLoading(false);
      }
    };
    calcular();
  }, [agendamentosConfirmadosSemana, agendamentosPrevistosSemana]);

  // Merge confirmed + simulated predicted quantities
  const produtosOrdenados = useMemo(() => {
    const merged: Record<string, ProdutoQuantidade> = {};
    
    // 100% of confirmed
    for (const [id, prod] of Object.entries(quantidadesPorProdutoConfirmados)) {
      merged[id] = { ...prod };
    }
    
    // Predicted * percentage
    if (incluirPrevistos && percentualPrevistos > 0) {
      for (const [id, prod] of Object.entries(quantidadesPorProdutoPrevistos)) {
        const qtdSimulada = Math.ceil(prod.quantidade * percentualPrevistos / 100);
        if (merged[id]) {
          merged[id].quantidade += qtdSimulada;
        } else {
          merged[id] = { ...prod, quantidade: qtdSimulada };
        }
      }
    }
    
    return Object.values(merged).sort((a, b) => b.quantidade - a.quantidade);
  }, [quantidadesPorProdutoConfirmados, quantidadesPorProdutoPrevistos, incluirPrevistos, percentualPrevistos]);

  const quantidadeTotal = useMemo(() => {
    return produtosOrdenados.reduce((sum, produto) => sum + produto.quantidade, 0);
  }, [produtosOrdenados]);

  const totalPedidos = agendamentosConfirmadosSemana.length + (incluirPrevistos ? agendamentosPrevistosSemana.length : 0);

  return <Card>
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-500" />
            Produtos Necessários
          </CardTitle>
          <CardDescription className="text-left">
            Quantidades para pedidos {incluirPrevistos ? `confirmados + ${percentualPrevistos}% previstos` : "confirmados"}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      {loading ? <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Calculando quantidades...</span>
        </div> : produtosOrdenados.length === 0 ? <div className="text-center py-8">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            Nenhum pedido {incluirPrevistos ? "confirmado ou previsto" : "confirmado"} nesta semana
          </p>
        </div> : <div className="space-y-4">
          {/* Total Geral */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-muted-foreground mb-1">Quantidade Total Necessária</p>
            <p className="text-3xl font-bold text-blue-600">{quantidadeTotal}</p>
            <Badge variant="default" className="mt-2 bg-blue-200">
              {totalPedidos} {totalPedidos === 1 ? 'pedido' : 'pedidos'}
            </Badge>
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
              {produtosOrdenados.map(produto => <div key={produto.produto_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{produto.produto_nome}</span>
                  </div>
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {produto.quantidade}
                  </Badge>
                </div>)}
            </CollapsibleContent>
          </Collapsible>
        </div>}
    </CardContent>
  </Card>;
}
