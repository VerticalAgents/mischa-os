import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseReceitas } from './useSupabaseReceitas';
import { useSupabaseProdutos } from './useSupabaseProdutos';
import { useRendimentosReceitaProduto } from './useRendimentosReceitaProduto';

const JANELA_DIAS = 28;
const SEMANAS_JANELA = JANELA_DIAS / 7; // 4

/**
 * Calcula o consumo médio semanal por insumo com base nas entregas
 * confirmadas dos últimos 28 dias (mesma lógica do useListaComprasAutomatica).
 * Retorna Map<insumoId, consumoMedioSemanal>.
 */
export const useConsumoSemanalInsumos = () => {
  const { receitas } = useSupabaseReceitas();
  const { produtos } = useSupabaseProdutos();
  const { rendimentos } = useRendimentosReceitaProduto();
  const [consumoSemanal, setConsumoSemanal] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (receitas.length === 0 || produtos.length === 0) return;
    let cancelled = false;

    const calcular = async () => {
      setLoading(true);
      try {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - JANELA_DIAS);
        const { data: entregas, error } = await supabase
          .from('historico_entregas')
          .select('itens')
          .eq('tipo', 'entrega')
          .gte('data', dataLimite.toISOString());
        if (error) throw error;

        const unidadesPorProduto = new Map<string, number>();
        (entregas || []).forEach((e: any) => {
          const itens = Array.isArray(e.itens) ? e.itens : [];
          itens.forEach((i: any) => {
            const pid = i.produto_id || i.produtoId;
            const qtd = Number(i.quantidade) || 0;
            if (!pid || qtd <= 0) return;
            unidadesPorProduto.set(pid, (unidadesPorProduto.get(pid) || 0) + qtd);
          });
        });

        const consumo = new Map<string, number>();
        unidadesPorProduto.forEach((unidades, produtoId) => {
          const rend = rendimentos.find(r => r.produto_id === produtoId);
          if (!rend?.rendimento) return;
          const receita = receitas.find(r => r.id === rend.receita_id);
          if (!receita) return;
          const formas = unidades / rend.rendimento;
          receita.itens.forEach(item => {
            const c = Number(item.quantidade) * formas;
            consumo.set(item.insumo_id, (consumo.get(item.insumo_id) || 0) + c);
          });
        });

        const semanal = new Map<string, number>();
        consumo.forEach((v, k) => semanal.set(k, v / SEMANAS_JANELA));
        if (!cancelled) setConsumoSemanal(semanal);
      } catch (err) {
        console.error('Erro ao calcular consumo semanal de insumos:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    calcular();
    return () => { cancelled = true; };
  }, [receitas, produtos, rendimentos]);

  return { consumoSemanal, loading };
};