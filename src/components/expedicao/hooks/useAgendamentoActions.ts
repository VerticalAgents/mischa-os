
import { useState } from "react";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { toast } from "sonner";

export const useAgendamentoActions = () => {
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState<any>(null);
  
  const { agendamentos, salvarAgendamento, carregarTodosAgendamentos } = useAgendamentoClienteStore();
  const { pedidos, carregarPedidos } = useExpedicaoStore();

  const handleEditarAgendamento = (pedidoId: string) => {
    console.log('🔧 Editando agendamento para pedido ID:', pedidoId);
    
    // Buscar primeiro nos agendamentos - use cliente.id para comparação
    const agendamento = agendamentos.find(a => String(a.cliente.id) === pedidoId);
    
    if (agendamento) {
      // Converter para o formato esperado pelo modal
      const agendamentoFormatado = {
        id: String(a.cliente.id),
        cliente: agendamento.cliente,
        dataReposicao: agendamento.dataReposicao,
        pedido: {
          totalPedidoUnidades: agendamento.cliente.quantidadePadrao
        }
      };
      
      console.log('🔧 Agendamento formatado para edição:', agendamentoFormatado);
      setAgendamentoParaEditar(agendamentoFormatado);
      setModalEditarAberto(true);
    } else {
      // Fallback: buscar nos pedidos da expedição
      const pedidoExpedicao = pedidos.find(p => String(p.id) === pedidoId);
      
      if (pedidoExpedicao) {
        const agendamentoFormatado = {
          id: String(pedidoExpedicao.id),
          cliente: {
            id: pedidoExpedicao.cliente_id,
            nome: pedidoExpedicao.cliente_nome,
            quantidadePadrao: pedidoExpedicao.quantidade_total
          },
          dataReposicao: pedidoExpedicao.data_prevista_entrega,
          pedido: {
            totalPedidoUnidades: pedidoExpedicao.quantidade_total
          }
        };
        
        console.log('🔧 Agendamento formatado para edição (fallback):', agendamentoFormatado);
        setAgendamentoParaEditar(agendamentoFormatado);
        setModalEditarAberto(true);
      } else {
        console.error('❌ Agendamento não encontrado para edição:', pedidoId);
        toast.error("Agendamento não encontrado");
      }
    }
  };

  const handleSalvarAgendamento = async (agendamentoAtualizado: any) => {
    try {
      console.log('💾 Salvando agendamento atualizado:', agendamentoAtualizado);
      
      await salvarAgendamento(agendamentoAtualizado.id, {
        data_proxima_reposicao: agendamentoAtualizado.dataReposicao,
        quantidade_total: agendamentoAtualizado.pedido?.totalPedidoUnidades || agendamentoAtualizado.cliente.quantidadePadrao
      });
      
      // Recarregar dados após atualização
      await carregarPedidos();
      await carregarTodosAgendamentos();
      
      toast.success("Agendamento atualizado com sucesso!");
      setModalEditarAberto(false);
      setAgendamentoParaEditar(null);
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      toast.error("Erro ao atualizar agendamento");
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
