import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseInsumos } from './useSupabaseInsumos';
import { useSupabaseReceitas } from './useSupabaseReceitas';
import { useSupabaseProdutos } from './useSupabaseProdutos';
import { useRendimentosReceitaProduto } from './useRendimentosReceitaProduto';

const JANELA_DIAS = 28;
const SEMANAS_JANELA = JANELA_DIAS / 7;

export interface LinhaListaCompras {
  insumoId: string;
  nome: string;
  unidade: string;
  consumoTotalPeriodo: number; // consumo nos 28 dias
  consumoMedioDia: number;     // média diária (28d / 28)
  consumoMedioSemanal: number; // média semanal (28d / 4)
  estoqueAtual: number;
  necessario: number;
  aComprar: number;
  custoMedio: number;
  custoTotal: number;
}

export interface ProdutoIgnorado {
  produtoId: string;
  nome: string;
  unidades: number;
  motivo: 'sem_rendimento' | 'sem_receita' | 'produto_nao_encontrado';
}

export const useListaComprasAutomatica = () => {
  const { insumos } = useSupabaseInsumos();
  const { receitas } = useSupabaseReceitas();
  const { produtos } = useSupabaseProdutos();
  const { rendimentos } = useRendimentosReceitaProduto();
  const [linhas, setLinhas] = useState<LinhaListaCompras[]>([]);
  const [totalCompra, setTotalCompra] = useState(0);
  const [loading, setLoading] = useState(false);
  const [coberturaUsada, setCoberturaUsada] = useState<number | null>(null);
  const [produtosIgnorados, setProdutosIgnorados] = useState<ProdutoIgnorado[]>([]);

  const gerar = useCallback(async (coberturaDias: number) => {
    setLoading(true);
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - JANELA_DIAS);
      const dataLimiteStr = dataLimite.toISOString();

      // 1. Buscar entregas confirmadas dos últimos 28 dias
      const { data: entregas, error } = await supabase
        .from('historico_entregas')
        .select('itens, data')
        .eq('tipo', 'entrega')
        .gte('data', dataLimiteStr);

      if (error) {
        console.error('Erro ao buscar entregas:', error);
        setLinhas([]);
        setTotalCompra(0);
        setProdutosIgnorados([]);
        return;
      }

      // 2. Somar unidades vendidas por produto
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

      // 3. Converter unidades -> formas via rendimento, somar consumo de insumos
      const consumoPorInsumo = new Map<string, number>(); // 28d
      const ignorados: ProdutoIgnorado[] = [];

      unidadesPorProduto.forEach((unidades, produtoId) => {
        const produto = produtos.find(p => p.id === produtoId);
        if (!produto) {
          ignorados.push({ produtoId, nome: `Produto ${produtoId.slice(0, 8)}`, unidades, motivo: 'produto_nao_encontrado' });
          return;
        }

        const rendimentoConfig = rendimentos.find(r => r.produto_id === produtoId);
        if (!rendimentoConfig || !rendimentoConfig.rendimento) {
          ignorados.push({ produtoId, nome: produto.nome, unidades, motivo: 'sem_rendimento' });
          return;
        }

        const receita = receitas.find(r => r.id === rendimentoConfig.receita_id);
        if (!receita) {
          ignorados.push({ produtoId, nome: produto.nome, unidades, motivo: 'sem_receita' });
          return;
        }

        const formas = unidades / rendimentoConfig.rendimento;
        receita.itens.forEach(item => {
          const consumo = Number(item.quantidade) * formas;
          consumoPorInsumo.set(
            item.insumo_id,
            (consumoPorInsumo.get(item.insumo_id) || 0) + consumo
          );
        });
      });

      // 4. Construir linhas
      const resultado: LinhaListaCompras[] = [];
      let total = 0;

      consumoPorInsumo.forEach((consumo28d, insumoId) => {
        const insumo = insumos.find(i => i.id === insumoId);
        if (!insumo) return;

        const medioSemanal = consumo28d / SEMANAS_JANELA; // /4
        const medioDia = consumo28d / JANELA_DIAS;
        const necessario = medioSemanal * (coberturaDias / 7);
        const estoqueAtual = Number(insumo.estoque_atual) || 0;
        const aComprar = Math.max(0, necessario - estoqueAtual);
        // custo_medio é o preço pago pelo volume_bruto (ex: R$ 4,19 por 1000 g).
        // Custo unitário real = custo_medio / volume_bruto.
        const volumeBruto = Number(insumo.volume_bruto) || 0;
        const custoMedioPack = Number(insumo.custo_medio) || 0;
        const custoUnit = volumeBruto > 0 ? custoMedioPack / volumeBruto : 0;
        const custoTotal = aComprar * custoUnit;
        total += custoTotal;

        resultado.push({
          insumoId,
          nome: insumo.nome,
          unidade: insumo.unidade_medida,
          consumoTotalPeriodo: consumo28d,
          consumoMedioDia: medioDia,
          consumoMedioSemanal: medioSemanal,
          estoqueAtual,
          necessario,
          aComprar,
          custoMedio: custoUnit,
          custoTotal,
        });
      });

      resultado.sort((a, b) => b.aComprar - a.aComprar);
      setLinhas(resultado);
      setTotalCompra(total);
      setCoberturaUsada(coberturaDias);
      setProdutosIgnorados(ignorados);
    } finally {
      setLoading(false);
    }
  }, [insumos, receitas, produtos, rendimentos]);

  return { linhas, totalCompra, loading, coberturaUsada, produtosIgnorados, gerar };
};
