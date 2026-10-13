import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TabelaPrecos } from '@/utils/faturamentoPedido';

const VAZIA: TabelaPrecos = { doCliente: new Map(), padrao: {} };

/**
 * Preço de todos os clientes por categoria + o padrão de cada categoria, em duas
 * consultas. É o que `valorDoPedido` precisa para precificar a semana inteira sem
 * ir ao banco pedido por pedido.
 */
export function useTabelaPrecos() {
  const [tabela, setTabela] = useState<TabelaPrecos>(VAZIA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;
    const carregar = async () => {
      try {
        const [precos, config] = await Promise.all([
          supabase.from('precos_categoria_cliente').select('cliente_id, categoria_id, preco_unitario'),
          supabase.from('configuracoes_sistema').select('configuracoes').eq('modulo', 'precificacao').limit(1).maybeSingle(),
        ]);
        if (precos.error) throw precos.error;
        if (config.error) throw config.error;
        if (cancelado) return;
        const doCliente = new Map<string, number>();
        (precos.data || []).forEach(p => doCliente.set(`${p.cliente_id}_${p.categoria_id}`, Number(p.preco_unitario)));
        const padrao = ((config.data?.configuracoes as { precosPorCategoria?: Record<string, number> } | null)?.precosPorCategoria) || {};
        setTabela({ doCliente, padrao });
      } catch (error) {
        console.error('Erro ao carregar a tabela de preços:', error);
      } finally {
        if (!cancelado) setLoading(false);
      }
    };
    carregar();
    return () => { cancelado = true; };
  }, []);

  return { tabela, loading };
}
