
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { ItemLancamento } from '@/utils/producaoDia';

export interface ResultadoConfirmacao {
  ok: boolean;
  motivo?: 'erro';
  confirmados?: number;
}

// A gravacao mora no banco, nas funcoes confirmar_producao_lote e lancar_producao_lote
// (supabase/migrations/20261012160000_producao_em_lote.sql): entrada do produto, saida
// dos insumos e troca de status numa transacao so. Antes eram varias gravacoes soltas
// feitas daqui, e uma queda de conexao deixava a confirmacao pela metade.
//
// O estoque de insumos do Mischa OS nao e mantido (decisao de 12/10/2026): quando falta
// saldo, a funcao repoe sozinha o que falta. Por isso nao existe mais a pergunta de
// "saldo insuficiente".
export const useConfirmacaoProducao = () => {
  const [loading, setLoading] = useState(false);

  const falhou = (titulo: string, error: unknown): ResultadoConfirmacao => {
    console.error(titulo, error);
    toast({
      title: titulo,
      description:
        (error as { message?: string })?.message || 'Ocorreu um erro inesperado. Nada foi gravado.',
      variant: 'destructive',
    });
    return { ok: false, motivo: 'erro' };
  };

  const confirmarLote = async (ids: string[]): Promise<ResultadoConfirmacao> => {
    if (ids.length === 0) return { ok: true, confirmados: 0 };
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('confirmar_producao_lote' as any, { p_ids: ids });
      if (error) return falhou('Erro ao confirmar produção', error);

      const confirmados = Number((data as any)?.confirmados ?? 0);
      toast({
        title: confirmados === 1 ? 'Produção confirmada' : `${confirmados} produções confirmadas`,
        description: 'Estoque de produtos atualizado.',
      });
      return { ok: true, confirmados };
    } catch (error) {
      return falhou('Erro ao confirmar produção', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmarProducao = (registroId: string) => confirmarLote([registroId]);

  const lancarLote = async (
    itens: ItemLancamento[],
    confirmar: boolean
  ): Promise<ResultadoConfirmacao> => {
    if (itens.length === 0) return { ok: false, motivo: 'erro' };
    setLoading(true);
    try {
      const { error } = await supabase.rpc('lancar_producao_lote' as any, {
        p_itens: itens,
        p_confirmar: confirmar,
      });
      if (error) return falhou('Erro ao lançar produção', error);

      const quantos = `${itens.length} ${itens.length === 1 ? 'produto' : 'produtos'}`;
      toast({
        title: confirmar ? 'Produção registrada e confirmada' : 'Produção registrada',
        description: confirmar
          ? `${quantos}. Estoque de produtos atualizado.`
          : `${quantos}. Fica pendente até você confirmar.`,
      });
      return { ok: true, confirmados: confirmar ? itens.length : 0 };
    } catch (error) {
      return falhou('Erro ao lançar produção', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    confirmarProducao,
    confirmarLote,
    lancarLote,
    loading,
  };
};
