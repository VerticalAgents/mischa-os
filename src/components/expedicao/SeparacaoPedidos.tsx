
import { useEffect } from "react";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { ResumoQuantidadesSeparacao } from "./ResumoQuantidadesSeparacao";

export function SeparacaoPedidos() {
  const { 
    pedidos, 
    isLoading, 
    carregarPedidos, 
    confirmarSeparacao, 
    desfazerSeparacao, 
    marcarTodosSeparados,
    getPedidosParaSeparacao 
  } = useExpedicaoStore();
  
  useEffect(() => {
    if (pedidos.length === 0 && !isLoading) {
      carregarPedidos();
    }
  }, [pedidos, isLoading, carregarPedidos]);

  const pedidosParaSeparacao = getPedidosParaSeparacao();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Separação de Pedidos</h2>
          <p className="text-muted-foreground">
            Pedidos que precisam ser separados para entrega hoje
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {pedidosParaSeparacao.length > 0 && (
            <Button
              onClick={() => marcarTodosSeparados(pedidosParaSeparacao)}
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar Todos Separados
            </Button>
          )}
        </div>
      </div>

      <ResumoQuantidadesSeparacao pedidos={pedidosParaSeparacao} />

      <div className="space-y-4">
        {pedidosParaSeparacao.map((pedido) => (
          <div key={pedido.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{pedido.cliente_nome}</h3>
                <p className="text-sm text-muted-foreground">
                  Quantidade: {pedido.quantidade_total}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => confirmarSeparacao(pedido.id)}
                  size="sm"
                  variant="outline"
                >
                  Confirmar Separação
                </Button>
                {pedido.substatus_pedido === 'Separado' && (
                  <Button
                    onClick={() => desfazerSeparacao(pedido.id)}
                    size="sm"
                    variant="ghost"
                  >
                    Desfazer
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
