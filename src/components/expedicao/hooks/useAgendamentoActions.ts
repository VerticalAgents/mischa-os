
import { useState } from "react";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { toast } from "sonner";

export const useAgendamentoActions = () => {
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState<any>(null);

  const { agendamentos, atualizarAgendamento } = useAgendamentoClienteStore();

  const handleEditarAgendamento = (pedidoId: string) => {
    console.log('🔧 Editando agendamento para pedido ID:', pedidoId);
    
    // Buscar nos agendamentos usando propriedades existentes
    const agendamento = agendamentos.find(a => a.cliente_id === pedidoId);
    if (agendamento) {
      setAgendamentoParaEditar({
        ...agendamento,
        data_entrega: agendamento.data_proxima_reposicao || new Date(),
        data_prevista_entrega: agendamento.data_proxima_reposicao || new Date()
      });
      setModalEditarAberto(true);
    } else {
      console.error('❌ Agendamento não encontrado:', pedidoId);
      toast.error('Agendamento não encontrado');
    }
  };

  const handleSalvarAgendamento = async (dadosAtualizados: any) => {
    try {
      console.log('💾 Salvando alterações no agendamento:', dadosAtualizados.cliente_id);
      
      // Usar carregarAgendamentos ao invés de atualizarAgendamento se não existir
      if (atualizarAgendamento) {
        await atualizarAgendamento(dadosAtualizados.cliente_id, dadosAtualizados);
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
