import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGestaoClickConfig } from './useGestaoClickConfig';

/**
 * Hook para buscar e cachear razões sociais do GestaoClick
 */
export const useRazaoSocialGC = () => {
  const { config } = useGestaoClickConfig();
  const [razoesSociais, setRazoesSociais] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Record<string, string>>({});
  const pendingIdsRef = useRef<Set<string>>(new Set());
  const fetchingRef = useRef(false);

  const buscarRazoesSociaisLote = useCallback(async (gcIds: string[]) => {
    if (!config?.access_token || !config?.secret_token) {
      console.log('[useRazaoSocialGC] GestaoClick não configurado');
      return;
    }
    
    // Filtrar IDs que não estão no cache e não estão pendentes
    const idsNaoCache = gcIds.filter(id => 
      id && !cacheRef.current[id] && !pendingIdsRef.current.has(id)
    );
    
    if (idsNaoCache.length === 0) return;

    // Marcar como pendentes
    idsNaoCache.forEach(id => pendingIdsRef.current.add(id));
    
    // Evitar múltiplas requisições simultâneas
    if (fetchingRef.current) return;
    fetchingRef.current = true;

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
          cacheRef.current[id] = '-';
        });
      } else if (data?.razoes_sociais) {
        console.log('[useRazaoSocialGC] Razões sociais recebidas:', Object.keys(data.razoes_sociais).length);
        cacheRef.current = { ...cacheRef.current, ...data.razoes_sociais };
      }
      
      setRazoesSociais({ ...cacheRef.current });
    } catch (err) {
      console.error('[useRazaoSocialGC] Erro ao buscar razões sociais:', err);
    } finally {
      // Limpar pendentes
      idsNaoCache.forEach(id => pendingIdsRef.current.delete(id));
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [config]);

  const getRazaoSocial = useCallback((gcId: string | undefined | null): string => {
    if (!gcId) return '-';
    return cacheRef.current[gcId] || '-';
  }, []);

  // Limpar cache ao desmontar
  useEffect(() => {
    return () => {
      pendingIdsRef.current.clear();
    };
  }, []);

  return {
    razoesSociais,
    loading,
    buscarRazoesSociaisLote,
    getRazaoSocial
  };
};
