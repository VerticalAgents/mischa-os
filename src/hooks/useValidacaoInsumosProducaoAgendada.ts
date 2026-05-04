import { useMemo } from 'react';
import { useSupabaseReceitas } from './useSupabaseReceitas';
import { useSupabaseInsumos } from './useSupabaseInsumos';
import { useRendimentosReceitaProduto } from './useRendimentosReceitaProduto';
import type { DiaProducaoAgendada } from './useProducaoAgendada';

export interface InsumoFaltanteDia {
  insumo_id: string;
  nome: string;
  unidade: string;
  necessario: number;
  disponivel: number;
  faltante: number;
}

export interface ValidacaoDia {
  data: string;
  status: 'ok' | 'faltante' | 'sem_receita';
  insumosFaltantes: InsumoFaltanteDia[];
  produtosSemReceita: string[];
}

/**
 * Calcula a viabilidade de cada dia agendado considerando o consumo
 * acumulado dos dias anteriores (lógica sequencial: hoje -> futuro).
 */
export const useValidacaoInsumosProducaoAgendada = (
  diasAgendados: DiaProducaoAgendada[]
) => {
  const { receitas } = useSupabaseReceitas();
  const { insumos } = useSupabaseInsumos();
  const { rendimentos } = useRendimentosReceitaProduto();

  return useMemo(() => {
    const validacoes = new Map<string, ValidacaoDia>();
    if (!diasAgendados.length) return validacoes;

    // Estoque inicial por insumo
    const estoqueRestante: Record<string, number> = {};
    for (const ins of insumos) {
      estoqueRestante[ins.id] = Number(ins.estoque_atual || 0);
    }

    // Iterar dias na ordem fornecida (já vem ordenado: hoje -> futuro -> passado).
    // Filtramos apenas hoje/futuro para a validação sequencial.
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (const dia of diasAgendados) {
      const dDate = new Date(dia.data + 'T12:00:00').getTime();
      // Para dias passados, ainda registramos validação isolada (sem consumir estoque novamente)
      const isFuture = dDate >= hoje.getTime();

      // Necessidade de insumos do dia
      const necessidade: Record<string, { nome: string; unidade: string; quantidade: number }> = {};
      const produtosSemReceita: string[] = [];

      for (const reg of dia.registros) {
        const formas = reg.formas_producidas || 0;
        if (formas <= 0) continue;

        // Localizar receita pelo produto via rendimentos_receita_produto
        const rendCfg = rendimentos.find((r) => r.produto_id === reg.produto_id);
        let receita = rendCfg ? receitas.find((r) => r.id === rendCfg.receita_id) : null;
        if (!receita) {
          // fallback: receita de mesmo nome
          receita = receitas.find((r) => r.nome === reg.produto_nome) || null;
        }
        if (!receita) {
          if (!produtosSemReceita.includes(reg.produto_nome)) {
            produtosSemReceita.push(reg.produto_nome);
          }
          continue;
        }

        for (const item of receita.itens) {
          const consumo = Number(item.quantidade) * formas;
          if (!necessidade[item.insumo_id]) {
            const insumo = insumos.find((i) => i.id === item.insumo_id);
            necessidade[item.insumo_id] = {
              nome: item.nome_insumo || insumo?.nome || 'Insumo',
              unidade: insumo?.unidade_medida || '',
              quantidade: 0,
            };
          }
          necessidade[item.insumo_id].quantidade += consumo;
        }
      }

      const insumosFaltantes: InsumoFaltanteDia[] = [];
      for (const [insumoId, n] of Object.entries(necessidade)) {
        const disponivel = estoqueRestante[insumoId] ?? 0;
        if (n.quantidade > disponivel + 1e-6) {
          insumosFaltantes.push({
            insumo_id: insumoId,
            nome: n.nome,
            unidade: n.unidade,
            necessario: n.quantidade,
            disponivel,
            faltante: n.quantidade - disponivel,
          });
        }
        // Subtrai do estoque restante (até zerar) — apenas para dias futuros
        if (isFuture) {
          estoqueRestante[insumoId] = Math.max(0, disponivel - n.quantidade);
        }
      }

      let status: ValidacaoDia['status'] = 'ok';
      if (insumosFaltantes.length > 0) status = 'faltante';
      else if (produtosSemReceita.length > 0 && Object.keys(necessidade).length === 0) status = 'sem_receita';

      validacoes.set(dia.data, {
        data: dia.data,
        status,
        insumosFaltantes,
        produtosSemReceita,
      });
    }

    return validacoes;
  }, [diasAgendados, receitas, insumos, rendimentos]);
};