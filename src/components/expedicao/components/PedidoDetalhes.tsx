
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProdutoDetalhe {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
}

interface PedidoDetalhesProps {
  pedidoId: string;
  tipoPedido: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export const PedidoDetalhes = ({ pedidoId, tipoPedido, isExpanded, onToggle }: PedidoDetalhesProps) => {
  const [produtos, setProdutos] = useState<ProdutoDetalhe[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const carregarDetalhes = async () => {
    if (!isExpanded || produtos.length > 0) return;

    setIsLoading(true);
    try {
      console.log('🔍 Carregando detalhes dos produtos para pedido:', pedidoId);
      
      const { data, error } = await supabase.rpc('compute_entrega_itens_v2', {
        p_agendamento_id: pedidoId
      });

      if (error) {
        console.error('Erro ao carregar detalhes dos produtos:', error);
        toast.error("Erro ao carregar detalhes dos produtos");
        return;
      }

      console.log('✅ Detalhes carregados:', data);
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro inesperado ao carregar detalhes:', error);
      toast.error("Erro inesperado ao carregar detalhes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      carregarDetalhes();
    }
  }, [isExpanded, pedidoId]);

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <Package className="h-4 w-4" />
        Ver produtos
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {isExpanded && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="text-sm text-muted-foreground">Carregando produtos...</div>
              </div>
            ) : produtos.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    Composição do Pedido {tipoPedido === 'Alterado' ? '(Personalizado)' : '(Padrão)'}
                  </span>
                </div>
                
                <div className="grid gap-2">
                  {produtos.map((produto, index) => (
                    <div key={`${produto.produto_id}-${index}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="font-medium text-sm">{produto.produto_nome}</span>
                      </div>
                      <Badge variant="secondary" className="font-mono">
                        {produto.quantidade} un.
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total de produtos:</span>
                    <Badge variant="outline">
                      {produtos.reduce((acc, p) => acc + p.quantidade, 0)} unidades
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum produto encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
