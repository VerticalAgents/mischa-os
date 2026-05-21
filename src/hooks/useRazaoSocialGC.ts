import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGestaoClickConfig } from './useGestaoClickConfig';

// ============================================================
// Module-level cache (shared across components & navigations)
// ============================================================
const moduleCache: Record<string, string> = {};
const pendingIds: Set<string> = new Set();
let isFetching = false;
let lastFetchAt = 0;
const FETCH_THROTTLE_MS = 2000;

/**
 * Hook para buscar e cachear razões sociais do GestaoClick
 * Cache vive em escopo de módulo — sobrevive a unmount/navegação.
 */
export const useRazaoSocialGC = () => {
  const { config } = useGestaoClickConfig();
  const [razoesSociais, setRazoesSociais] = useState<Record<string, string>>({ ...moduleCache });
  const [loading, setLoading] = useState(false);

  const buscarRazoesSociaisLote = useCallback(async (gcIds: string[]) => {
    if (!config?.access_token || !config?.secret_token) {
      console.log('[useRazaoSocialGC] GestaoClick não configurado');
      return;
    }

    // Filtrar IDs que não estão no cache de módulo e não estão pendentes
    const idsNaoCache = gcIds.filter(id => 
      id && !moduleCache[id] && !pendingIds.has(id)
    );

    if (idsNaoCache.length === 0) return;

    // Throttle: ignorar disparos muito próximos quando já temos algo recente
    const now = Date.now();
    if (isFetching || now - lastFetchAt < FETCH_THROTTLE_MS) {
      return;
    }

    // Marcar como pendentes
    idsNaoCache.forEach(id => pendingIds.add(id));
    isFetching = true;
    lastFetchAt = now;

    setLoading(true);
    try {
      console.log('[useRazaoSocialGC] Buscando razões sociais para', idsNaoCache.length, 'clientes');
      
      const { data, error } = await supabase.functions.invoke('gestaoclick-proxy', {
        body: {
          action: 'buscar_razoes_sociais_lote',
          gestaoclick_cliente_ids: idsNaoCache,
          access_token: config.access_token,
          secret_token: config.secret_token
        }
      });

      if (error) {
        console.error('[useRazaoSocialGC] Erro na edge function:', error);
        // Marcar como "-" para não tentar novamente
        idsNaoCache.forEach(id => {
          moduleCache[id] = '-';
        });
      } else if (data?.razoes_sociais) {
        console.log('[useRazaoSocialGC] Razões sociais recebidas:', Object.keys(data.razoes_sociais).length);
        Object.assign(moduleCache, data.razoes_sociais);
      }
      
      setRazoesSociais({ ...moduleCache });
    } catch (err) {
      console.error('[useRazaoSocialGC] Erro ao buscar razões sociais:', err);
    } finally {
      idsNaoCache.forEach(id => pendingIds.delete(id));
      isFetching = false;
      setLoading(false);
    }
  }, [config]);

  const getRazaoSocial = useCallback((gcId: string | undefined | null): string => {
    if (!gcId) return '-';
    return moduleCache[gcId] || '-';
  }, []);

  return {
    razoesSociais,
    loading,
    buscarRazoesSociaisLote,
    getRazaoSocial
  };
};
