import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseInsumos } from './useSupabaseInsumos';
import { useMovimentacoesEstoqueInsumos } from './useMovimentacoesEstoqueInsumos';

const JANELA_DIAS = 28;

export interface LinhaListaCompras {
  insumoId: string;
  nome: string;
  unidade: string;
  consumoTotalPeriodo: number;
  consumoMedioDia: number;
  estoqueAtual: number;
  necessario: number;
  aComprar: number;
  custoMedio: number;
  custoTotal: number;
}

export const useListaComprasAutomatica = () => {
  const { insumos } = useSupabaseInsumos();
  const { obterSaldoInsumo } = useMovimentacoesEstoqueInsumos();
  const [linhas, setLinhas] = useState<LinhaListaCompras[]>([]);
  const [totalCompra, setTotalCompra] = useState(0);
  const [loading, setLoading] = useState(false);
  const [coberturaUsada, setCoberturaUsada] = useState<number | null>(null);

  const gerar = useCallback(async (coberturaDias: number) => {
    setLoading(true);
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - JANELA_DIAS);
      const dataLimiteStr = dataLimite.toISOString().split('T')[0];

      const { data: movs, error } = await supabase
        .from('movimentacoes_estoque_insumos')
        .select('insumo_id, quantidade, tipo, data_movimentacao')
        .eq('tipo', 'saida')
        .gte('data_movimentacao', dataLimiteStr);

      if (error) {
        console.error('Erro ao buscar movimentações:', error);
        setLinhas([]);
        setTotalCompra(0);
        return;
      }

      const consumoPorInsumo = new Map<string, number>();
      (movs || []).forEach((m: any) => {
        const atual = consumoPorInsumo.get(m.insumo_id) || 0;
        consumoPorInsumo.set(m.insumo_id, atual + (Number(m.quantidade) || 0));
      });

      const resultado: LinhaListaCompras[] = [];
      let total = 0;

      for (const insumo of insumos) {
        const consumoTotal = consumoPorInsumo.get(insumo.id) || 0;
        const consumoMedio = consumoTotal / JANELA_DIAS;
        const necessario = consumoMedio * coberturaDias;

        let estoqueAtual = 0;
        try {
          estoqueAtual = await obterSaldoInsumo(insumo.id);
        } catch {
          estoqueAtual = insumo.estoque_atual || 0;
        }

        const aComprar = Math.max(0, necessario - estoqueAtual);
        const custoUnit = Number(insumo.custo_medio) || 0;
        const custoTotal = aComprar * custoUnit;
        total += custoTotal;

        resultado.push({
          insumoId: insumo.id,
          nome: insumo.nome,
          unidade: insumo.unidade_medida,
          consumoTotalPeriodo: consumoTotal,
          consumoMedioDia: consumoMedio,
          estoqueAtual,
          necessario,
          aComprar,
          custoMedio: custoUnit,
          custoTotal,
        });
      }

      resultado.sort((a, b) => b.aComprar - a.aComprar);
      setLinhas(resultado);
      setTotalCompra(total);
      setCoberturaUsada(coberturaDias);
    } finally {
      setLoading(false);
    }
  }, [insumos, obterSaldoInsumo]);

  return { linhas, totalCompra, loading, coberturaUsada, gerar };
};
