
import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProdutoNomeDisplay from "./ProdutoNomeDisplay";
import { useSupabaseProporoesPadrao } from "@/hooks/useSupabaseProporoesPadrao";
import { calcularQuantidadesPadrao, ordenarItensPorOrdemCategoria } from "@/utils/proporcoesPadrao";

interface ProdutosListProps {
  pedido: {
    tipo_pedido: string;
    quantidade_total: number;
    itens_personalizados?: any[];
  };
}

export default function ProdutosList({ pedido }: ProdutosListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { proporcoes } = useSupabaseProporoesPadrao();

  const isAlterado = pedido.tipo_pedido === "Alterado";

  // Filtrar itens personalizados que têm quantidade maior que 0 e ordenar pela ordem_categoria
  const itensComQuantidade = useMemo(() => {
    const filtrados = pedido.itens_personalizados?.filter(item => item.quantidade > 0) || [];
    return ordenarItensPorOrdemCategoria(filtrados, proporcoes);
  }, [pedido.itens_personalizados, proporcoes]);

  // Para pedidos Padrão, calcular composição a partir das proporções vigentes
  const itensPadraoCalculados = useMemo(() => {
    if (isAlterado) return [];
    return calcularQuantidadesPadrao(pedido.quantidade_total, proporcoes);
  }, [isAlterado, pedido.quantidade_total, proporcoes]);

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-auto p-2 justify-start text-left w-full hover:bg-gray-50"
      >
        <Package className="h-4 w-4 mr-2 flex-shrink-0" />
        <span className="mr-2">Ver produtos</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 ml-auto" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-auto" />
        )}
      </Button>

      {isExpanded && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 ml-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-blue-800">
              Composição do Pedido ({isAlterado ? "Alterado" : "Padrão"})
            </h4>
            <Badge variant={isAlterado ? "secondary" : "default"}>
              {isAlterado ? "Alterado" : "Padrão"}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {isAlterado && itensComQuantidade.length > 0 ? (
              itensComQuantidade.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <ProdutoNomeDisplay 
                      produtoId={item.produto_id || 'custom'} 
                      nomeFallback={item.produto || item.nome} 
                    />
                  </div>
                  <span className="font-medium text-blue-700">
                    {item.quantidade} un.
                  </span>
                </div>
              ))
            ) : !isAlterado && itensPadraoCalculados.length > 0 ? (
              itensPadraoCalculados.map((item) => (
                <div key={item.produto_id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    <ProdutoNomeDisplay
                      produtoId={item.produto_id}
                      nomeFallback={item.produto_nome}
                    />
                  </div>
                  <span className="font-medium text-blue-700">
                    {item.quantidade} un.
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-blue-600 italic">
                Produtos padrão conforme configuração
              </div>
            )}
          </div>
          
          <div className="border-t border-blue-300 mt-3 pt-2">
            <div className="flex justify-between items-center text-sm font-medium text-blue-800">
              <span>Total de produtos:</span>
              <span>{pedido.quantidade_total} unidades</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
