
import { useState } from "react";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ProdutoNomeDisplay from "./ProdutoNomeDisplay";

interface ComposicaoPedidoProps {
  pedido: {
    tipo_pedido: string;
    quantidade_total: number;
    itens_personalizados?: any[];
  };
}

export default function ComposicaoPedido({ pedido }: ComposicaoPedidoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isPadrao = pedido.tipo_pedido === "Padrão";

  return (
    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 justify-start text-left w-full hover:bg-transparent"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Composição do Pedido ({isPadrao ? "Padrão" : "Alterado"})
                </span>
                <Badge variant={isPadrao ? "default" : "secondary"} className="text-xs">
                  {isPadrao ? "Padrão" : "Alterado"}
                </Badge>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-blue-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-blue-600" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>

        <div className="mt-2">
          <p className="text-xs text-blue-600 italic">
            {isPadrao ? "Produtos padrão conforme configuração" : "Produtos personalizados"}
          </p>
        </div>

        <CollapsibleContent className="mt-3">
          <div className="space-y-2">
            {pedido.itens_personalizados && pedido.itens_personalizados.length > 0 ? (
              pedido.itens_personalizados.map((item: any, index: number) => (
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
            ) : (
              <div className="text-sm text-blue-600 italic">
                Distribuição automática conforme produtos cadastrados
              </div>
            )}
          </div>
          
          <div className="border-t border-blue-300 mt-3 pt-2">
            <div className="flex justify-between items-center text-sm font-medium text-blue-800">
              <span>Total de produtos:</span>
              <span>{pedido.quantidade_total} unidades</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
