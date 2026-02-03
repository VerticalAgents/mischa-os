import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RecebimentoGC } from '@/components/expedicao/gestaoclick/types';

interface UseGestaoClickBoletoReturn {
  buscarRecebimentos: (clienteGcId: string, dataVenda: string, valorVenda: number) => Promise<RecebimentoGC[]>;
  abrirBoleto: (recebimentoId: string) => void;
  loading: boolean;
  recebimentos: RecebimentoGC[];
}

export function useGestaoClickBoleto(): UseGestaoClickBoletoReturn {
  const [loading, setLoading] = useState(false);
  const [recebimentos, setRecebimentos] = useState<RecebimentoGC[]>([]);

  const buscarRecebimentos = useCallback(async (
    clienteGcId: string, 
    dataVenda: string,
    valorVenda: number
  ): Promise<RecebimentoGC[]> => {
    setLoading(true);
    try {
      // Buscar configuração do GestaoClick
      const { data: configData, error: configError } = await supabase
        .from('integracoes_config')
        .select('config')
        .eq('integracao', 'gestaoclick')
        .maybeSingle();

      if (configError || !configData?.config) {
        throw new Error('Configuração do GestaoClick não encontrada');
      }

      const config = configData.config as { access_token?: string; secret_token?: string };
      
      if (!config.access_token || !config.secret_token) {
        throw new Error('Tokens do GestaoClick não configurados');
      }

      // Chamar edge function para buscar recebimentos
      const { data, error } = await supabase.functions.invoke('gestaoclick-proxy', {
        body: {
          action: 'buscar_recebimentos_venda',
          access_token: config.access_token,
          secret_token: config.secret_token,
          cliente_id: clienteGcId,
          data_venda: dataVenda,
          valor_venda: valorVenda
        }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao buscar recebimentos');
      }

      const recebimentosEncontrados = data.recebimentos || [];
      setRecebimentos(recebimentosEncontrados);
      
      return recebimentosEncontrados;
    } catch (err) {
      console.error('[useGestaoClickBoleto] Erro ao buscar recebimentos:', err);
      toast.error('Erro ao buscar boleto', {
        description: err instanceof Error ? err.message : 'Tente novamente'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const abrirBoleto = useCallback((recebimentoId: string) => {
    // URL de impressão do boleto no GestaoClick
    // Formato provável baseado na análise da API
    const url = `https://app.gestaoclick.com/recebimentos/imprimir/${recebimentoId}`;
    window.open(url, '_blank');
  }, []);

  return {
    buscarRecebimentos,
    abrirBoleto,
    loading,
    recebimentos
  };
}
