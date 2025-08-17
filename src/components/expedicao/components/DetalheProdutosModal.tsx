
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProdutoNomeDisplay from "../ProdutoNomeDisplay";

interface DetalheProdutosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamento: any;
}

interface ProdutoQuantidade {
  produto_id?: string;
  produto_nome: string;
  quantidade: number;
}

export const DetalheProdutosModal = ({ open, onOpenChange, agendamento }: DetalheProdutosModalProps) => {
  const [produtos, setProdutos] = useState<ProdutoQuantidade[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!agendamento || !open) return;

    const calcularProdutos = async () => {
      setLoading(true);
      try {
        console.log('🔄 Calculando produtos para agendamento:', agendamento);

        if (agendamento.tipo_pedido === 'Alterado' && agendamento.itens_personalizados?.length > 0) {
          // Pedido alterado - usar itens personalizados
          console.log('📦 Usando itens personalizados:', agendamento.itens_personalizados);
          const produtosPersonalizados = agendamento.itens_personalizados.map((item: any) => ({
            produto_id: item.produto_id,
            produto_nome: item.produto || item.nome || 'Produto não identificado',
            quantidade: item.quantidade || 0
          }));
          setProdutos(produtosPersonalizados);
        } else {
          // Pedido padrão - mostrar texto fixo para evitar loop
          console.log('⚖️ Pedido padrão - mostrando configuração padrão');
          setProdutos([{
            produto_nome: "Produtos padrão conforme configuração",
            quantidade: agendamento.quantidade_total
          }]);
        }
      } catch (error) {
        console.error('❌ Erro ao calcular produtos:', error);
        setProdutos([{
          produto_nome: "Erro ao calcular produtos",
          quantidade: 0
        }]);
      } finally {
        setLoading(false);
      }
    };

    calcularProdutos();
  }, [agendamento, open]);

  if (!agendamento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produtos do Pedido - {agendamento.cliente_nome}
          </DialogTitle>
          <DialogDescription>
            Detalhamento dos produtos para este agendamento ({agendamento.tipo_pedido})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">{agendamento.cliente_nome}</p>
              <p className="text-sm text-gray-600">
                Total: {agendamento.quantidade_total} unidades
              </p>
            </div>
            <Badge variant={agendamento.tipo_pedido === 'Alterado' ? 'secondary' : 'default'}>
              {agendamento.tipo_pedido}
            </Badge>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Calculando produtos...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-medium">Composição do Pedido:</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {produtos.length > 0 ? produtos.map((produto, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      {produto.produto_id ? (
                        <ProdutoNomeDisplay 
                          produtoId={produto.produto_id} 
                          nomeFallback={produto.produto_nome} 
                        />
                      ) : (
                        <span>{produto.produto_nome}</span>
                      )}
                    </div>
                    <Badge variant="outline">
                      {produto.quantidade} un.
                    </Badge>
                  </div>
                )) : (
                  <div className="text-center py-4 text-gray-500">
                    Nenhum produto encontrado
                  </div>
                )}
              </div>
              
              {produtos.length > 0 && (
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center font-medium">
                    <span>Total de produtos:</span>
                    <span>{produtos.reduce((sum, p) => sum + p.quantidade, 0)} unidades</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
