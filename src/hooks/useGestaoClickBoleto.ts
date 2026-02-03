import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RecebimentoGC } from '@/components/expedicao/gestaoclick/types';

interface BoletoInfo {
  id: string;
  codigo: string;
  valor: string;
  data_vencimento: string;
  nome_cliente: string;
  liquidado: string;
  // PagHiper fields (quando disponível)
  transaction_id?: string;
  url_slip_pdf?: string;
  status?: string;
}

interface UseGestaoClickBoletoReturn {
  buscarRecebimentos: (clienteGcId: string, dataVenda: string, valorVenda: number) => Promise<RecebimentoGC[]>;
  buscarBoletoPagHiper: (transactionId: string) => Promise<BoletoInfo | null>;
  abrirBoleto: (recebimentoId: string, urlPdf?: string) => void;
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

  const buscarBoletoPagHiper = useCallback(async (transactionId: string): Promise<BoletoInfo | null> => {
    setLoading(true);
    try {
      console.log('[useGestaoClickBoleto] Buscando boleto no PagHiper:', transactionId);
      
      const { data, error } = await supabase.functions.invoke('paghiper-proxy', {
        body: {
          action: 'buscar_boleto',
          transaction_id: transactionId
        }
      });

      if (error) throw error;

      if (!data?.success) {
        console.warn('[useGestaoClickBoleto] PagHiper não encontrou boleto:', data?.error);
        return null;
      }

      return {
        id: data.transaction_id,
        codigo: data.order_id,
        valor: (data.value_cents / 100).toFixed(2),
        data_vencimento: data.due_date,
        nome_cliente: data.payer_name || '',
        liquidado: data.status === 'paid' ? '1' : '0',
        transaction_id: data.transaction_id,
        url_slip_pdf: data.url_slip_pdf,
        status: data.status
      };
    } catch (err) {
      console.error('[useGestaoClickBoleto] Erro ao buscar boleto no PagHiper:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const abrirBoleto = useCallback((recebimentoId: string, urlPdf?: string) => {
    if (urlPdf) {
      // Se temos a URL direta do PDF do PagHiper, usar ela
      console.log('[useGestaoClickBoleto] Abrindo PDF do PagHiper:', urlPdf);
      window.open(urlPdf, '_blank');
    } else {
      // Fallback: abrir página de visualização do GestaoClick
      // O usuário precisa estar logado no GC para ver
      const url = `https://app.gestaoclick.com/recebimentos/visualizar/${recebimentoId}`;
      console.log('[useGestaoClickBoleto] Abrindo página do GestaoClick:', url);
      window.open(url, '_blank');
      
      toast.info('Abrindo GestaoClick', {
        description: 'Você precisa estar logado no GestaoClick para visualizar o boleto.'
      });
    }
  }, []);

  return {
    buscarRecebimentos,
    buscarBoletoPagHiper,
    abrirBoleto,
    loading,
    recebimentos
  };
}
