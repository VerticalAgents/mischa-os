import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProducaoAgendadaItem {
  produto_id: string;
  produto_nome: string;
  unidades: number;
  registros: number;
}

export const useProducaoAgendada = () => {
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('historico_producao')
        .select('id, produto_id, produto_nome, unidades_previstas, unidades_calculadas, formas_producidas')
        .eq('status', 'Registrado');

      if (error) {
        console.error('❌ [ProducaoAgendada] Erro:', error);
        setRegistros([]);
      } else {
        setRegistros(data || []);
      }
    } catch (err) {
      console.error('❌ [ProducaoAgendada] Erro:', err);
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const produtosAgrupados = useMemo((): ProducaoAgendadaItem[] => {
    const mapa: Record<string, ProducaoAgendadaItem> = {};
    
    for (const reg of registros) {
      const id = reg.produto_id || reg.produto_nome;
      const unidades = reg.unidades_previstas || reg.unidades_calculadas || 0;
      
      if (mapa[id]) {
        mapa[id].unidades += unidades;
        mapa[id].registros += 1;
      } else {
        mapa[id] = {
          produto_id: reg.produto_id || '',
          produto_nome: reg.produto_nome,
          unidades,
          registros: 1,
        };
      }
    }

    return Object.values(mapa).sort((a, b) => b.unidades - a.unidades);
  }, [registros]);

  const mapaPorProduto = useMemo((): Record<string, number> => {
    const mapa: Record<string, number> = {};
    for (const item of produtosAgrupados) {
      if (item.produto_id) {
        mapa[item.produto_id] = item.unidades;
      }
    }
    return mapa;
  }, [produtosAgrupados]);

  const totalUnidades = useMemo(() => {
    return produtosAgrupados.reduce((sum, p) => sum + p.unidades, 0);
  }, [produtosAgrupados]);

  const totalRegistros = registros.length;

  return {
    produtosAgrupados,
    mapaPorProduto,
    totalUnidades,
    totalRegistros,
    loading,
    recarregar: carregar,
  };
};
