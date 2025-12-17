import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useGestaoClickSync() {
  const [loading, setLoading] = useState(false);
  const [pedidoEmProcessamento, setPedidoEmProcessamento] = useState<string | null>(null);

  const gerarVendaGC = useCallback(async (agendamentoId: string, clienteId: string) => {
    setLoading(true);
    setPedidoEmProcessamento(agendamentoId);
    
    try {
      const { data, error } = await supabase.functions.invoke('gestaoclick-proxy', {
        body: {
          action: 'criar_venda',
          agendamento_id: agendamentoId,
          cliente_id: clienteId
        }
      });

      if (error) {
        console.error('Erro ao chamar Edge Function:', error);
        toast.error(error.message || 'Erro ao conectar com GestaoClick');
        return { success: false, vendaId: null };
      }

      if (data?.error) {
        // If already has venda, return that info
        if (data.venda_id) {
          toast.info(`Pedido já possui venda vinculada #${data.venda_id}`);
          return { success: true, vendaId: data.venda_id, alreadyExists: true };
        }
        toast.error(data.error);
        return { success: false, vendaId: null };
      }

      toast.success(`Venda #${data.venda_id} criada no GestaoClick!`);
      return { success: true, vendaId: data.venda_id };

    } catch (error) {
      console.error('Erro ao gerar venda GestaoClick:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar venda no GestaoClick');
      return { success: false, vendaId: null };
    } finally {
      setLoading(false);
      setPedidoEmProcessamento(null);
    }
  }, []);

  const atualizarVendaGC = useCallback(async (agendamentoId: string, clienteId: string, vendaId: string) => {
    setLoading(true);
    setPedidoEmProcessamento(agendamentoId);
    
    try {
      const { data, error } = await supabase.functions.invoke('gestaoclick-proxy', {
        body: {
          action: 'atualizar_venda',
          agendamento_id: agendamentoId,
          cliente_id: clienteId,
          venda_id: vendaId
        }
      });

      if (error) {
        console.error('Erro ao atualizar venda GC:', error);
        toast.error(error.message || 'Erro ao atualizar venda no GestaoClick');
        return false;
      }

      if (data?.error) {
        toast.error(data.error);
        return false;
      }

      toast.success(`Venda #${vendaId} atualizada no GestaoClick!`);
      return true;

    } catch (error) {
      console.error('Erro ao atualizar venda GestaoClick:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar venda no GestaoClick');
      return false;
    } finally {
      setLoading(false);
      setPedidoEmProcessamento(null);
    }
  }, []);

  return {
    gerarVendaGC,
    atualizarVendaGC,
    loading,
    pedidoEmProcessamento
  };
}