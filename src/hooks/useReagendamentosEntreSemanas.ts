import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ReagendamentoEntreSemanas {
  id: string;
  cliente_id: string;
  cliente_nome?: string;
  data_original: string;
  data_nova: string;
  semana_original: string;
  semana_nova: string;
  semanas_adiadas: number;
  created_at: string;
}

interface ReagendamentoResumo {
  total: number;
  mediaSemanas: number;
  topClientes: { nome: string; count: number }[];
}

export function useReagendamentosEntreSemanas() {
  const [reagendamentos, setReagendamentos] = useState<ReagendamentoEntreSemanas[]>([]);
  const [resumo, setResumo] = useState<ReagendamentoResumo>({ total: 0, mediaSemanas: 0, topClientes: [] });
  const [isLoading, setIsLoading] = useState(true);

  const carregar = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reagendamentos_entre_semanas' as any)
        .select('*, clientes(nome)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items: ReagendamentoEntreSemanas[] = (data || []).map((r: any) => ({
        id: r.id,
        cliente_id: r.cliente_id,
        cliente_nome: r.clientes?.nome || 'Desconhecido',
        data_original: r.data_original,
        data_nova: r.data_nova,
        semana_original: r.semana_original,
        semana_nova: r.semana_nova,
        semanas_adiadas: r.semanas_adiadas,
        created_at: r.created_at,
      }));

      setReagendamentos(items);

      // Calcular resumo
      const total = items.length;
      const mediaSemanas = total > 0
        ? items.reduce((acc, r) => acc + r.semanas_adiadas, 0) / total
        : 0;

      // Top 3 clientes
      const countMap: Record<string, { nome: string; count: number }> = {};
      items.forEach((r) => {
        if (!countMap[r.cliente_id]) {
          countMap[r.cliente_id] = { nome: r.cliente_nome || '', count: 0 };
        }
        countMap[r.cliente_id].count++;
      });
      const topClientes = Object.values(countMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      setResumo({ total, mediaSemanas, topClientes });
    } catch (error) {
      console.error('Erro ao carregar reagendamentos entre semanas:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { reagendamentos, resumo, isLoading, recarregar: carregar };
}
