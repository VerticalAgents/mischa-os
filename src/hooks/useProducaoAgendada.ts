import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProducaoAgendadaItem {
  produto_id: string;
  produto_nome: string;
  unidades: number;
  registros: number;
}

export interface RegistroProducaoAgendada {
  id: string;
  produto_id: string;
  produto_nome: string;
  formas_producidas: number;
  unidades_previstas?: number | null;
  unidades_calculadas?: number | null;
  rendimento_usado?: number | null;
  data_producao: string;
  turno?: string | null;
  unidades: number;
}

export interface DiaProducaoAgendada {
  data: string;
  dataFormatada: string;
  registros: RegistroProducaoAgendada[];
  totalFormas: number;
  totalUnidades: number;
}

export const useProducaoAgendada = () => {
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('historico_producao')
        .select('id, produto_id, produto_nome, unidades_previstas, unidades_calculadas, formas_producidas, rendimento_usado, data_producao, turno')
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

  const diasAgendados = useMemo((): DiaProducaoAgendada[] => {
    const mapa: Record<string, DiaProducaoAgendada> = {};
    for (const reg of registros) {
      const data: string = reg.data_producao;
      if (!data) continue;
      const unidades = Number(reg.unidades_previstas || reg.unidades_calculadas || 0);
      const formas = Number(reg.formas_producidas || 0);
      if (!mapa[data]) {
        const d = new Date(data + 'T12:00:00');
        const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
        const dataFormatada =
          weekday.charAt(0).toUpperCase() + weekday.slice(1) +
          ', ' + d.toLocaleDateString('pt-BR');
        mapa[data] = {
          data,
          dataFormatada,
          registros: [],
          totalFormas: 0,
          totalUnidades: 0,
        };
      }
      mapa[data].registros.push({
        id: reg.id,
        produto_id: reg.produto_id || '',
        produto_nome: reg.produto_nome,
        formas_producidas: formas,
        unidades_previstas: reg.unidades_previstas,
        unidades_calculadas: reg.unidades_calculadas,
        rendimento_usado: reg.rendimento_usado,
        data_producao: data,
        turno: reg.turno,
        unidades,
      });
      mapa[data].totalFormas += formas;
      mapa[data].totalUnidades += unidades;
    }
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const arr = Object.values(mapa);
    arr.sort((a, b) => {
      const da = new Date(a.data + 'T12:00:00').getTime();
      const db = new Date(b.data + 'T12:00:00').getTime();
      const aFuture = da >= hoje.getTime();
      const bFuture = db >= hoje.getTime();
      if (aFuture && !bFuture) return -1;
      if (!aFuture && bFuture) return 1;
      if (aFuture && bFuture) return da - db;
      return db - da;
    });
    return arr;
  }, [registros]);

  return {
    produtosAgrupados,
    mapaPorProduto,
    totalUnidades,
    totalRegistros,
    diasAgendados,
    registros,
    loading,
    recarregar: carregar,
  };
};
