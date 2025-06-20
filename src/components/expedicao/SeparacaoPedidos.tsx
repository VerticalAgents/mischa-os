
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { useExpedicaoSync } from "@/hooks/useExpedicaoSync";
import { usePedidoConverter } from "./hooks/usePedidoConverter";
import { useAgendamentoActions } from "./hooks/useAgendamentoActions";
import { PrintingActions } from "./components/PrintingActions";
import { SeparacaoTabs } from "./components/SeparacaoTabs";
import EditarAgendamentoDialog from "../agendamento/EditarAgendamentoDialog";
import { toast } from "sonner";
import { Check } from "lucide-react";

export const SeparacaoPedidos = () => {
  const [activeSubTab, setActiveSubTab] = useState<string>("todos");
  const mountedRef = useRef(false);
  
  const {
    pedidos,
    isLoading,
    confirmarSeparacao,
    marcarTodosSeparados,
    getPedidosParaSeparacao,
    getPedidosProximoDia,
    carregarPedidos
  } = useExpedicaoStore();

  const { converterPedidoParaCard } = usePedidoConverter();
  const {
    modalEditarAberto,
    setModalEditarAberto,
    agendamentoParaEditar,
    handleEditarAgendamento,
    handleSalvarAgendamento
  } = useAgendamentoActions();

  // Usar hook de sincronização
  useExpedicaoSync();

  // Carregar pedidos apenas uma vez ao montar
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      console.log('🔄 Carregando pedidos inicial da SeparacaoPedidos');
      carregarPedidos();
    }
  }, [carregarPedidos]);

  // Obter pedidos filtrados
  const pedidosParaSeparacao = getPedidosParaSeparacao();
  const pedidosProximoDia = getPedidosProximoDia();
  
  // Separar por tipo
  const pedidosPadrao = pedidosParaSeparacao.filter(p => p.tipo_pedido === "Padrão");
  const pedidosAlterados = pedidosParaSeparacao.filter(p => p.tipo_pedido === "Alterado");
  
  // Lista combinada para "todos"
  const todosPedidos = [...pedidosPadrao, ...pedidosAlterados];

  const marcarTodosComoSeparados = async () => {
    let listaAtual: any[] = [];
    
    if (activeSubTab === "padrao") {
      listaAtual = pedidosPadrao;
    } else if (activeSubTab === "alterados") {
      listaAtual = pedidosAlterados;
    } else if (activeSubTab === "proximos") {
      listaAtual = pedidosProximoDia;
    } else {
      listaAtual = todosPedidos;
    }
    
    if (listaAtual.length === 0) {
      toast.error("Não há pedidos para separar nesta categoria.");
      return;
    }
    
    await marcarTodosSeparados(listaAtual);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">Carregando pedidos...</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold">Separação de Pedidos</h2>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={marcarTodosComoSeparados} 
              size="sm" 
              className="flex items-center gap-1"
            >
              <Check className="h-4 w-4" /> Marcar todos como separados
            </Button>
            <PrintingActions
              activeSubTab={activeSubTab}
              pedidosPadrao={pedidosPadrao}
              pedidosAlterados={pedidosAlterados}
              pedidosProximoDia={pedidosProximoDia}
              todosPedidos={todosPedidos}
            />
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
        />
      </Card>

      {/* Modal de edição de agendamento */}
      {agendamentoParaEditar && (
        <EditarAgendamentoDialog
          agendamento={agendamentoParaEditar}
          open={modalEditarAberto}
          onOpenChange={setModalEditarAberto}
          onSalvar={handleSalvarAgendamento}
        />
      )}
    </div>
  );
};
