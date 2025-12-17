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
        return false;
      }

      if (data?.error) {
        toast.error(data.error);
        return false;
      }

      toast.success(`Venda #${data.venda_id} criada no GestaoClick!`);
      return true;

    } catch (error) {
      console.error('Erro ao gerar venda GestaoClick:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar venda no GestaoClick');
      return false;
    } finally {
      setLoading(false);
      setPedidoEmProcessamento(null);
    }
  }, []);

  return {
    gerarVendaGC,
    loading,
    pedidoEmProcessamento
  };
}
