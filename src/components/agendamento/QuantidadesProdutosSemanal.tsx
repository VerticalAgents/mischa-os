import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Package, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek } from "date-fns";

interface QuantidadesProdutosSemanelProps {
  agendamentosFiltrados: any[];
  semanaAtual: Date;
}

interface ProdutoQuantidade {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
}

export default function QuantidadesProdutosSemanal({ 
  agendamentosFiltrados, 
  semanaAtual 
}: QuantidadesProdutosSemanelProps) {
  const [incluirPrevistos, setIncluirPrevistos] = useState(false);
  const [quantidadesPorProduto, setQuantidadesPorProduto] = useState<Record<string, ProdutoQuantidade>>({});
  const [loading, setLoading] = useState(false);

  // Filtrar agendamentos da semana com base no toggle
  const agendamentosSemana = useMemo(() => {
    const inicioSemana = startOfWeek(semanaAtual, { weekStartsOn: 1 });
    const fimSemana = endOfWeek(semanaAtual, { weekStartsOn: 1 });
    
    return agendamentosFiltrados.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.dataReposicao);
      const dentroSemana = dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana;
      
      if (!dentroSemana) return false;
      
      // Filtrar por status baseado no toggle
      if (incluirPrevistos) {
        return agendamento.statusAgendamento === "Agendado" || agendamento.statusAgendamento === "Previsto";
      } else {
        return agendamento.statusAgendamento === "Agendado";
      }
    });
  }, [agendamentosFiltrados, semanaAtual, incluirPrevistos]);

  // Calcular quantidades de produtos
  useEffect(() => {
    const calcularQuantidades = async () => {
      if (agendamentosSemana.length === 0) {
        setQuantidadesPorProduto({});
        return;
      }

      console.log('🔍 Calculando quantidades para', agendamentosSemana.length, 'agendamentos');

      setLoading(true);
      try {
        const quantidadesTemp: Record<string, ProdutoQuantidade> = {};

        // Processar cada agendamento
        for (const agendamento of agendamentosSemana) {
          // Validar que o ID existe
          if (!agendamento.id) {
            console.error('❌ Agendamento sem ID:', agendamento);
            continue;
          }

          console.log('📦 Processando agendamento:', agendamento.id, 'Status:', agendamento.statusAgendamento);

          try {
            // Chamar a função RPC para calcular os itens
            const { data, error } = await supabase.rpc('compute_entrega_itens_v2', {
              p_agendamento_id: agendamento.id
            });

            if (error) {
              console.error(`❌ Erro ao calcular itens para ${agendamento.cliente.nome}:`, error);
              continue;
            }

            console.log('✅ Itens recebidos para agendamento', agendamento.id, ':', data);

            if (data && Array.isArray(data)) {
              // Agregar quantidades por produto
              data.forEach((item: any) => {
                const produtoId = item.produto_id;
                const produtoNome = item.produto_nome;
                const quantidade = item.quantidade;

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
            }
          } catch (error) {
            console.error(`❌ Erro ao processar agendamento ${agendamento.cliente.nome}:`, error);
          }
        }

        console.log('📊 Resultado final:', quantidadesTemp);
        setQuantidadesPorProduto(quantidadesTemp);
      } catch (error) {
        console.error('❌ Erro ao calcular quantidades de produtos:', error);
      } finally {
        setLoading(false);
      }
    };

    calcularQuantidades();
  }, [agendamentosSemana]);

  const produtosOrdenados = useMemo(() => {
    return Object.values(quantidadesPorProduto)
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [quantidadesPorProduto]);

  const quantidadeTotal = useMemo(() => {
    return produtosOrdenados.reduce((sum, produto) => sum + produto.quantidade, 0);
  }, [produtosOrdenados]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quantidades de Produtos da Semana</CardTitle>
            <CardDescription className="text-left mt-1">
              Produtos necessários para atender os pedidos {incluirPrevistos ? "confirmados e previstos" : "confirmados"}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="incluir-previstos"
              checked={incluirPrevistos}
              onCheckedChange={setIncluirPrevistos}
            />
            <Label htmlFor="incluir-previstos" className="text-sm cursor-pointer">
              Incluir previstos
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Calculando quantidades...</span>
          </div>
        ) : produtosOrdenados.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              Nenhum pedido {incluirPrevistos ? "confirmado ou previsto" : "confirmado"} nesta semana
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total Geral */}
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quantidade Total</p>
                <p className="text-2xl font-bold">{quantidadeTotal}</p>
              </div>
              <Badge variant="default" className="text-lg px-4 py-2">
                {agendamentosSemana.length} {agendamentosSemana.length === 1 ? 'pedido' : 'pedidos'}
              </Badge>
            </div>

            {/* Produtos Individuais */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground mb-3">Detalhes por Produto</p>
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
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
