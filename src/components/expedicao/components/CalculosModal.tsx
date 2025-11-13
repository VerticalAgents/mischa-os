
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calculator, Package } from "lucide-react";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DetalheProdutosModal } from "./DetalheProdutosModal";
import { ProdutosEmExpedicao } from "./ProdutosEmExpedicao";

interface CalculosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CalculosModal = ({ open, onOpenChange }: CalculosModalProps) => {
  const { pedidos } = useExpedicaoStore();
  const [detalheProdutosAberto, setDetalheProdutosAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<any>(null);

  // Filtrar pedidos separados (independente da data)
  const pedidosSeparados = pedidos.filter(p => p.substatus_pedido === 'Separado');
  
  // Filtrar pedidos despachados (independente da data)
  const pedidosDespachados = pedidos.filter(p => p.substatus_pedido === 'Despachado');

  const handleVerProdutos = (pedido: any) => {
    setAgendamentoSelecionado(pedido);
    setDetalheProdutosAberto(true);
  };

  const PedidoItem = ({ pedido }: { pedido: any }) => (
    <div className="p-3 border rounded-lg bg-white space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-sm">{pedido.cliente_nome}</h4>
          <p className="text-xs text-gray-600">
            Data: {format(new Date(pedido.data_prevista_entrega), 'dd/MM/yyyy')}
          </p>
        </div>
        <Badge variant={pedido.tipo_pedido === 'Alterado' ? 'secondary' : 'default'} className="text-xs">
          {pedido.tipo_pedido}
        </Badge>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-700">
          Total: {pedido.quantidade_total} unidades
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleVerProdutos(pedido)}
          className="flex items-center gap-1 text-xs"
        >
          <Package className="h-3 w-3" />
          Ver Produtos
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cálculos de Separação
            </DialogTitle>
            <DialogDescription>
              Ferramenta para auxiliar no desenvolvimento visual do raciocínio de separação de pedidos.
            </DialogDescription>
          </DialogHeader>

          {/* Card de Produtos em Expedição */}
          <ProdutosEmExpedicao 
            pedidosSeparados={pedidosSeparados} 
            pedidosDespachados={pedidosDespachados} 
          />

          <div className="grid grid-cols-2 gap-6">
            {/* Lista de Pedidos Separados */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Pedidos Separados</h3>
                <Badge variant="secondary">
                  {pedidosSeparados.length}
                </Badge>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                {pedidosSeparados.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                    <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Nenhum pedido separado</p>
                  </div>
                ) : (
                  pedidosSeparados.map(pedido => (
                    <PedidoItem key={pedido.id} pedido={pedido} />
                  ))
                )}
              </div>
            </div>

            {/* Lista de Pedidos Despachados */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Pedidos Despachados</h3>
                <Badge variant="secondary">
                  {pedidosDespachados.length}
                </Badge>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                {pedidosDespachados.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                    <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Nenhum pedido despachado</p>
                  </div>
                ) : (
                  pedidosDespachados.map(pedido => (
                    <PedidoItem key={pedido.id} pedido={pedido} />
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes dos Produtos */}
      <DetalheProdutosModal
        open={detalheProdutosAberto}
        onOpenChange={setDetalheProdutosAberto}
        agendamento={agendamentoSelecionado}
      />
    </>
  );
};
