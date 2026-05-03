import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Package, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek } from "date-fns";

interface QuantidadesProdutosSemanelProps {
  agendamentosFiltrados: any[];
  semanaAtual: Date;
  incluirPrevistos: boolean;
  percentualPrevistos: number;
  onToggleIncluirPrevistos?: (checked: boolean) => void;
  onChangePercentualPrevistos?: (value: number) => void;
  modoPrevistos?: 'provaveis' | 'percentual';
  onChangeModoPrevistos?: (modo: 'provaveis' | 'percentual') => void;
  scoresPrevistos?: Map<string, { score: number }>;
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
  percentualPrevistos,
  onToggleIncluirPrevistos,
  onChangePercentualPrevistos,
  modoPrevistos = 'percentual',
  onChangeModoPrevistos,
  scoresPrevistos,
}: QuantidadesProdutosSemanelProps) {
  const [quantidadesPorProdutoConfirmados, setQuantidadesPorProdutoConfirmados] = useState<Record<string, ProdutoQuantidade>>({});
  const [quantidadesPorProdutoPrevistos, setQuantidadesPorProdutoPrevistos] = useState<Record<string, ProdutoQuantidade>>({});
  const [quantidadesPorProdutoPrevistosProvaveis, setQuantidadesPorProdutoPrevistosProvaveis] = useState<Record<string, ProdutoQuantidade>>({});
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

  const previstosProvaveis = useMemo(() => {
    if (!scoresPrevistos) return agendamentosPrevistosSemana;
    return agendamentosPrevistosSemana.filter(a => (scoresPrevistos.get(a.cliente.id)?.score ?? 0) > 85);
  }, [agendamentosPrevistosSemana, scoresPrevistos]);

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
        const [confirmados, previstos, provaveis] = await Promise.all([
          agendamentosConfirmadosSemana.length > 0 ? fetchQuantidades(agendamentosConfirmadosSemana) : Promise.resolve({}),
          agendamentosPrevistosSemana.length > 0 ? fetchQuantidades(agendamentosPrevistosSemana) : Promise.resolve({}),
          previstosProvaveis.length > 0 ? fetchQuantidades(previstosProvaveis) : Promise.resolve({})
        ]);
        setQuantidadesPorProdutoConfirmados(confirmados);
        setQuantidadesPorProdutoPrevistos(previstos);
        setQuantidadesPorProdutoPrevistosProvaveis(provaveis as Record<string, ProdutoQuantidade>);
      } catch (error) {
        console.error('Erro ao calcular quantidades:', error);
      } finally {
        setLoading(false);
      }
    };
    calcular();
  }, [agendamentosConfirmadosSemana, agendamentosPrevistosSemana, previstosProvaveis]);

  // Merge confirmed + simulated predicted quantities
  const produtosOrdenados = useMemo(() => {
    const merged: Record<string, ProdutoQuantidade> = {};
    
    // 100% of confirmed
    for (const [id, prod] of Object.entries(quantidadesPorProdutoConfirmados)) {
      merged[id] = { ...prod };
    }
    
    if (incluirPrevistos) {
      if (modoPrevistos === 'provaveis') {
        // 100% das unidades dos previstos prováveis (score > 85)
        for (const [id, prod] of Object.entries(quantidadesPorProdutoPrevistosProvaveis)) {
          if (merged[id]) {
            merged[id].quantidade += prod.quantidade;
          } else {
            merged[id] = { ...prod };
          }
        }
      } else if (percentualPrevistos > 0) {
        for (const [id, prod] of Object.entries(quantidadesPorProdutoPrevistos)) {
          const qtdSimulada = Math.ceil(prod.quantidade * percentualPrevistos / 100);
          if (merged[id]) {
            merged[id].quantidade += qtdSimulada;
          } else {
            merged[id] = { ...prod, quantidade: qtdSimulada };
          }
        }
      }
    }
    
    return Object.values(merged).sort((a, b) => b.quantidade - a.quantidade);
  }, [quantidadesPorProdutoConfirmados, quantidadesPorProdutoPrevistos, quantidadesPorProdutoPrevistosProvaveis, incluirPrevistos, percentualPrevistos, modoPrevistos, agendamentosPrevistosSemana, previstosProvaveis]);

  const quantidadeTotal = useMemo(() => {
    return produtosOrdenados.reduce((sum, produto) => sum + produto.quantidade, 0);
  }, [produtosOrdenados]);

  const totalPedidos = agendamentosConfirmadosSemana.length + (
    incluirPrevistos
      ? (modoPrevistos === 'provaveis' ? previstosProvaveis.length : agendamentosPrevistosSemana.length)
      : 0
  );

  const isProvavelMode = incluirPrevistos && modoPrevistos === 'provaveis';
  return <Card className={isProvavelMode ? 'border-purple-300 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20' : ''}>
    <CardHeader>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Package className={`h-4 w-4 md:h-5 md:w-5 ${isProvavelMode ? 'text-purple-500' : 'text-blue-500'}`} />
            Produtos Necessários
          </CardTitle>
          <CardDescription className="text-left text-xs md:text-sm">
            Quantidades para pedidos {incluirPrevistos
              ? (modoPrevistos === 'provaveis'
                  ? 'confirmados + previstos prováveis'
                  : `confirmados + ${percentualPrevistos}% previstos`)
              : "confirmados"}
          </CardDescription>
        </div>
        {onToggleIncluirPrevistos && (
          <div className="flex items-center gap-2 sm:gap-3 sm:justify-end flex-wrap">
            <div className="flex items-center gap-2">
              <Label htmlFor="incluir-previstos-prod" className="text-sm cursor-pointer whitespace-nowrap">
                Incluir previstos
              </Label>
              <Switch
                id="incluir-previstos-prod"
                checked={incluirPrevistos}
                onCheckedChange={onToggleIncluirPrevistos}
              />
            </div>
            {incluirPrevistos && onChangeModoPrevistos && (
              <RadioGroup
                value={modoPrevistos}
                onValueChange={(v) => onChangeModoPrevistos(v as 'provaveis' | 'percentual')}
                className="flex items-center gap-3"
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="provaveis" id="modo-provaveis" />
                  <Label htmlFor="modo-provaveis" className="text-xs cursor-pointer whitespace-nowrap">
                    Apenas prováveis
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="percentual" id="modo-percentual" />
                  <Label htmlFor="modo-percentual" className="text-xs cursor-pointer whitespace-nowrap">
                    Percentual
                  </Label>
                </div>
              </RadioGroup>
            )}
            {incluirPrevistos && modoPrevistos === 'percentual' && onChangePercentualPrevistos && (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={percentualPrevistos}
                  onChange={(e) => onChangePercentualPrevistos(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-16 h-8 text-center text-sm"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            )}
          </div>
        )}
      </div>
    </CardHeader>
    <CardContent>
      {loading ? <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Calculando quantidades...</span>
        </div> : produtosOrdenados.length === 0 ? <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
          <Package className="h-4 w-4 opacity-50" />
          <p>
            Nenhum pedido {incluirPrevistos ? "confirmado ou previsto" : "confirmado"} nesta semana
          </p>
        </div> : <div className="space-y-4">
          {/* Total Geral */}
          <div className={`p-3 md:p-4 rounded-lg border ${isProvavelMode ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800' : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'}`}>
            <p className="text-xs md:text-sm text-muted-foreground mb-1">Quantidade Total Necessária</p>
            <p className={`text-2xl md:text-3xl font-bold ${isProvavelMode ? 'text-purple-600' : 'text-blue-600'}`}>{quantidadeTotal}</p>
            <Badge variant="default" className={`mt-2 ${isProvavelMode ? 'bg-purple-200 text-purple-900 hover:bg-purple-200' : 'bg-blue-200'}`}>
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
