
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckSquare } from "lucide-react";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { usePedidoConverter } from "./hooks/usePedidoConverter";
import { useAgendamentoActions } from "./hooks/useAgendamentoActions";
import { SeparacaoTabs } from "./components/SeparacaoTabs";

export default function SeparacaoPedidos() {
  const {
    pedidos,
    isLoading,
    carregarPedidos,
    confirmarSeparacao,
    desfazerSeparacao,
    marcarTodosSeparados,
    getPedidosParaSeparacao,
    getPedidosProximoDia
  } = useExpedicaoStore();

  const { converterPedidoParaCard } = usePedidoConverter();
  const { handleEditarAgendamento } = useAgendamentoActions();
  const [activeSubTab, setActiveSubTab] = useState("todos");

  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  const todosPedidos = getPedidosParaSeparacao();
  const pedidosPadrao = todosPedidos.filter(p => p.tipo_pedido === 'Padrão');
  const pedidosAlterados = todosPedidos.filter(p => p.tipo_pedido === 'Alterado');
  const pedidosProximoDia = getPedidosProximoDia();

  const pedidosParaSeparar = todosPedidos.filter(p => 
    !p.substatus_pedido || p.substatus_pedido === 'Agendado'
  );

  const handleMarcarTodosSeparados = async () => {
    if (pedidosParaSeparar.length === 0) {
      return;
    }
    
    await marcarTodosSeparados(pedidosParaSeparar);
    await carregarPedidos(); // Recarregar para atualizar o estado
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Separação de Pedidos</h2>
          <p className="text-muted-foreground">
            Confirme a separação dos pedidos agendados para hoje
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {pedidosParaSeparar.length > 0 && (
            <Button
              onClick={handleMarcarTodosSeparados}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <CheckSquare className="h-4 w-4" />
              Separar Todos ({pedidosParaSeparar.length})
            </Button>
          )}
          
          <Button
            onClick={carregarPedidos}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <SeparacaoTabs
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        todosPedidos={todosPedidos}
        pedidosPadrao={pedidosPadrao}
        pedidosAlterados={pedidosAlterados}
        pedidosProximoDia={pedidosProximoDia}
        converterPedidoParaCard={converterPedidoParaCard}
        confirmarSeparacao={confirmarSeparacao}
        handleEditarAgendamento={handleEditarAgendamento}
        desfazerSeparacao={desfazerSeparacao}
      />
    </div>
  );
}
