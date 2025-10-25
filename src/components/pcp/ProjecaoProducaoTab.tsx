import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Package, Loader2, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { startOfWeek, endOfWeek } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { EstoqueDisponivel } from "./EstoqueDisponivel";

interface ProdutoQuantidade {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
}

export default function ProjecaoProducaoTab() {
  const [incluirPrevistos, setIncluirPrevistos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [semanaAtual] = useState(new Date());
  const [quantidadesPorProduto, setQuantidadesPorProduto] = useState<Record<string, ProdutoQuantidade>>({});

  const { agendamentos, carregarTodosAgendamentos } = useAgendamentoClienteStore();

  // Carregar agendamentos na montagem do componente
  useEffect(() => {
    const loadData = async () => {
      console.log('🚀 Carregando agendamentos para projeção...');
      if (agendamentos.length === 0) {
        await carregarTodosAgendamentos();
      }
    };
    loadData();
  }, [carregarTodosAgendamentos]);

  // Filtrar agendamentos da semana
  const agendamentosSemana = useMemo(() => {
    const inicioSemana = startOfWeek(semanaAtual, { weekStartsOn: 1 });
    const fimSemana = endOfWeek(semanaAtual, { weekStartsOn: 1 });
    
    const filtrados = agendamentos.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.dataReposicao);
      const dentroSemana = dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana;
      
      if (!dentroSemana) return false;
      
      if (incluirPrevistos) {
        return agendamento.statusAgendamento === "Agendado" || 
               agendamento.statusAgendamento === "Previsto";
      } else {
        return agendamento.statusAgendamento === "Agendado";
      }
    });

    console.log('📊 Agendamentos da semana filtrados:', {
      total: filtrados.length,
      incluirPrevistos,
      inicioSemana: inicioSemana.toISOString(),
      fimSemana: fimSemana.toISOString()
    });

    return filtrados;
  }, [agendamentos, semanaAtual, incluirPrevistos]);

  // Calcular quantidades de produtos
  useEffect(() => {
    const calcularQuantidades = async () => {
      if (agendamentosSemana.length === 0) {
        console.log('ℹ️ Nenhum agendamento para processar');
        setQuantidadesPorProduto({});
        setLoading(false);
        return;
      }

      setLoading(true);
      console.log('🔄 Calculando quantidades para', agendamentosSemana.length, 'agendamentos...');

      try {
        const quantidadesTemp: Record<string, ProdutoQuantidade> = {};

        for (const agendamento of agendamentosSemana) {
          if (!agendamento.id) {
            console.warn('⚠️ Agendamento sem ID:', agendamento);
            continue;
          }

          console.log('📦 Processando agendamento:', {
            id: agendamento.id,
            cliente: agendamento.cliente?.nome,
            status: agendamento.statusAgendamento
          });

          const { data, error } = await supabase.rpc('compute_entrega_itens_v2', {
            p_agendamento_id: agendamento.id
          });

          if (error) {
            console.error('❌ Erro ao calcular itens para agendamento', agendamento.id, ':', error);
            continue;
          }

          if (data && Array.isArray(data)) {
            console.log('✅ Itens calculados:', data);
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
        }

        console.log('✅ Quantidades finais calculadas:', quantidadesTemp);
        setQuantidadesPorProduto(quantidadesTemp);
      } catch (error) {
        console.error('❌ Erro ao calcular quantidades:', error);
      } finally {
        setLoading(false);
      }
    };

    calcularQuantidades();
  }, [agendamentosSemana]);

  // Processar dados para visualização
  const produtosOrdenados = useMemo(() => {
    return Object.values(quantidadesPorProduto)
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [quantidadesPorProduto]);

  const quantidadeTotal = useMemo(() => {
    return produtosOrdenados.reduce((sum, produto) => sum + produto.quantidade, 0);
  }, [produtosOrdenados]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Produtos Necessários</CardTitle>
              <CardDescription>
                Quantidade total de produtos para pedidos da semana
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="incluir-previstos" className="text-sm cursor-pointer">
                Incluir previstos
              </Label>
              <Switch
                id="incluir-previstos"
                checked={incluirPrevistos}
                onCheckedChange={setIncluirPrevistos}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Calculando quantidades...</p>
              </div>
            </div>
          )}

          {!loading && agendamentosSemana.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">
                Nenhum pedido {incluirPrevistos ? '(agendado ou previsto)' : 'agendado'} encontrado para esta semana
              </p>
            </div>
          )}

          {!loading && agendamentosSemana.length > 0 && (
            <>
              <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Necessário:</span>
                  <span className="text-2xl font-bold text-foreground">{quantidadeTotal}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pedidos na semana:</span>
                  <span className="font-medium">{agendamentosSemana.length}</span>
                </div>
              </div>

              <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="text-sm font-medium">
                      Ver detalhes por produto ({produtosOrdenados.length})
                    </span>
                    {isDetailsOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-2 pt-2">
                  {produtosOrdenados.map((produto) => (
                    <div
                      key={produto.produto_id}
                      className="flex items-center justify-between rounded-md border bg-card p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{produto.produto_nome}</span>
                      </div>
                      <span className="text-lg font-bold text-foreground">
                        {produto.quantidade}
                      </span>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </CardContent>
      </Card>

      <EstoqueDisponivel />
    </div>
  );
}