
import { useState } from "react";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { toast } from "sonner";

export const useAgendamentoActions = () => {
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState<any>(null);

  const { agendamentos, salvarAgendamento } = useAgendamentoClienteStore();

  const handleEditarAgendamento = (pedidoId: string) => {
    console.log('🔧 Editando agendamento para pedido ID:', pedidoId);
    
    // Buscar nos agendamentos usando a propriedade cliente.id
    const agendamento = agendamentos.find(a => a.cliente.id === pedidoId);
    if (agendamento) {
      setAgendamentoParaEditar({
        ...agendamento,
        data_entrega: agendamento.dataReposicao || new Date(),
        data_prevista_entrega: agendamento.dataReposicao || new Date()
      });
      setModalEditarAberto(true);
    } else {
      console.error('❌ Agendamento não encontrado:', pedidoId);
      toast.error('Agendamento não encontrado');
    }
  };

  const handleSalvarAgendamento = async (dadosAtualizados: any) => {
    try {
      console.log('💾 Salvando alterações no agendamento:', dadosAtualizados.cliente?.id || dadosAtualizados.cliente_id);
      
      // Usar salvarAgendamento disponível no store
      if (salvarAgendamento) {
        const clienteId = dadosAtualizados.cliente?.id || dadosAtualizados.cliente_id;
        await salvarAgendamento(clienteId, dadosAtualizados);
      }
      
      setModalEditarAberto(false);
      setAgendamentoParaEditar(null);
      
      toast.success('Agendamento atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar agendamento:', error);
      toast.error('Erro ao salvar agendamento');
    }
  };

  return {
    modalEditarAberto,
    setModalEditarAberto,
    agendamentoParaEditar,
    handleEditarAgendamento,
    handleSalvarAgendamento
  };
};
