
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { useExpedicaoSync } from "@/hooks/useExpedicaoSync";
import { usePedidoConverter } from "./hooks/usePedidoConverter";
import { useAgendamentoActions } from "./hooks/useAgendamentoActions";
import { PrintingActions } from "./components/PrintingActions";
import { SeparacaoTabs } from "./components/SeparacaoTabs";
import { DebugInfo } from "./components/DebugInfo";
import AgendamentoEditModal from "../agendamento/AgendamentoEditModal";
import { toast } from "sonner";
import { Check, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export const SeparacaoPedidos = () => {
  const [activeSubTab, setActiveSubTab] = useState<string>("todos");
  const mountedRef = useRef(false);
  
  const {
    pedidos,
    isLoading,
    ultimaAtualizacao,
    confirmarSeparacao,
    marcarTodosSeparados,
    atualizarDataReferencia,
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
      console.log('🔄 Carregamento inicial da SeparacaoPedidos');
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
    
    console.log('✅ Marcando todos como separados:', listaAtual.map(p => p.id));
    await marcarTodosSeparados(listaAtual);
  };

  const handleConfirmarSeparacao = async (pedidoId: string) => {
    try {
      console.log('✅ Iniciando confirmação de separação para pedido ID:', pedidoId, 'Tipo:', typeof pedidoId);
      
      // Debug adicional para verificar se o ID está correto
      const pedidoEncontrado = pedidos.find(p => String(p.id) === String(pedidoId));
      console.log('🔍 Pedido encontrado na lista:', pedidoEncontrado ? 'SIM' : 'NÃO');
      console.log('🔍 ID original do pedido:', pedidoId);
      console.log('🔍 Todos os IDs disponíveis:', pedidos.map(p => ({ id: p.id, tipo: typeof p.id })));
      
      await confirmarSeparacao(pedidoId);
      console.log('✅ Separação confirmada com sucesso para pedido:', pedidoId);
    } catch (error) {
      console.error('❌ Erro ao confirmar separação:', error);
      toast.error("Erro ao confirmar separação");
    }
  };

  const handleAtualizarData = async () => {
    await atualizarDataReferencia();
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
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold">Separação de Pedidos</h2>
            {ultimaAtualizacao && (
              <p className="text-sm text-muted-foreground">
                Última atualização: {format(ultimaAtualizacao, 'dd/MM/yyyy HH:mm:ss')}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleAtualizarData}
              size="sm" 
              variant="outline"
              className="flex items-center gap-1"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar Data
            </Button>
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
        
        {/* Debug Info Component */}
        <DebugInfo tipo="separacao" dadosAtivos={todosPedidos} />
        
        <SeparacaoTabs
          activeSubTab={activeSubTab}
          setActiveSubTab={setActiveSubTab}
          todosPedidos={todosPedidos}
          pedidosPadrao={pedidosPadrao}
          pedidosAlterados={pedidosAlterados}
          pedidosProximoDia={pedidosProximoDia}
          converterPedidoParaCard={converterPedidoParaCard}
          confirmarSeparacao={handleConfirmarSeparacao}
          handleEditarAgendamento={handleEditarAgendamento}
        />
      </Card>

      {/* Modal de edição de agendamento completo */}
      {agendamentoParaEditar && (
        <AgendamentoEditModal
          agendamento={agendamentoParaEditar}
          open={modalEditarAberto}
          onOpenChange={setModalEditarAberto}
          onSalvar={handleSalvarAgendamento}
        />
      )}
    </div>
  );
};
