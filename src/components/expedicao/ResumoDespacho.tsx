
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp } from "lucide-react";
import { useProdutoStore } from "@/hooks/useProdutoStore";
import { usePedidoConverter } from "./hooks/usePedidoConverter";
import ProdutoNomeDisplay from "./ProdutoNomeDisplay";

interface ResumoDespachoProps {
  pedidos: any[];
  titulo: string;
}

interface ItemPedido {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
}

interface ResumoProduto {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
}

export default function ResumoDespacho({ pedidos, titulo }: ResumoDespachoProps) {
  const { produtos } = useProdutoStore();
  const { converterPedidoParaCard } = usePedidoConverter();

  // Calcular resumo dos produtos
  const resumoProdutos = pedidos.reduce((acc, pedido) => {
    const pedidoConvertido = converterPedidoParaCard(pedido);
    
    pedidoConvertido.itens.forEach((item: ItemPedido) => {
      if (!acc[item.produto_id]) {
        acc[item.produto_id] = {
          produto_id: item.produto_id,
          produto_nome: item.produto_nome,
          quantidade: 0
        };
      }
      acc[item.produto_id].quantidade += item.quantidade;
    });
    
    return acc;
  }, {} as Record<string, ResumoProduto>);

  const resumoProdutosArray = Object.values(resumoProdutos) as ResumoProduto[];
  const totalUnidades = resumoProdutosArray.reduce((sum: number, item: ResumoProduto) => sum + item.quantidade, 0);
  const totalPedidos = pedidos.length;

  if (totalPedidos === 0) {
    return null;
  }

  return (
    <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
          <TrendingUp className="h-5 w-5" />
          Resumo - {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-800">{totalPedidos}</div>
            <div className="text-sm text-blue-600">Pedidos</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-800">{totalUnidades}</div>
            <div className="text-sm text-blue-600">Unidades Total</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-800">{resumoProdutosArray.length}</div>
            <div className="text-sm text-blue-600">Produtos Diferentes</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-800">
              {totalPedidos > 0 ? Math.round(totalUnidades / totalPedidos) : 0}
            </div>
            <div className="text-sm text-blue-600">Média por Pedido</div>
          </div>
        </div>

        {resumoProdutosArray.length > 0 && (
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Composição por Produto
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {resumoProdutosArray
                .sort((a: ResumoProduto, b: ResumoProduto) => b.quantidade - a.quantidade)
                .map((item: ResumoProduto) => (
                  <div key={item.produto_id} className="flex justify-between items-center bg-blue-50 p-2 rounded border border-blue-100">
                    <ProdutoNomeDisplay 
                      produtoId={item.produto_id} 
                      nomeFallback={item.produto_nome}
                      className="text-sm text-blue-700"
                    />
                    <span className="font-semibold text-blue-800 text-sm">
                      {item.quantidade} un.
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
