/**
 * Mexer em título a receber, direto do painel.
 *
 * **Isto escreve no Gestão Click**, não no Mischa OS. Por isso aqui só existem
 * as duas ações que a tela de inadimplência já permite:
 *
 *   1. mudar o vencimento
 *   2. marcar como recebido (dar baixa), com data e forma de pagamento
 *
 * O que NÃO existe, nem lá nem aqui, e não deve ser inventado: mudar o valor,
 * apagar título, renegociar. O próprio proxy protege o valor — ele relê o
 * título e reenvia os campos financeiros como estavam.
 *
 * Duas travas que vêm do servidor e valem lembrar:
 *   - título já liquidado não tem o vencimento alterado;
 *   - o Gestão Click responde "ok" mesmo quando recusa, então o proxy relê o
 *     título depois de gravar e confere se mudou de verdade.
 */
import { supabase } from './supabase';

export interface FormaDePagamento {
  id: string;
  nome: string;
}

/**
 * Os tokens do Gestão Click ficam em `integracoes_config`, visíveis só para o
 * dono da conta. É a mesma leitura que a tela de inadimplência faz.
 */
async function tokens(): Promise<{ access_token: string; secret_token: string }> {
  const { data } = await supabase
    .from('integracoes_config')
    .select('config')
    .eq('integracao', 'gestaoclick')
    .maybeSingle();

  const config = (data?.config || {}) as { access_token?: string; secret_token?: string };

  if (!config.access_token || !config.secret_token) {
    throw new Error('A integração com o Gestão Click não está configurada nesta conta.');
  }

  return { access_token: config.access_token, secret_token: config.secret_token };
}

async function chamar<T>(corpo: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('gestaoclick-proxy', {
    body: { ...(await tokens()), ...corpo },
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || 'o Gestão Click recusou a operação');

  return data as T;
}

export async function listarFormasDePagamento(): Promise<FormaDePagamento[]> {
  const resposta = await chamar<{ formas_pagamento: FormaDePagamento[] }>({
    action: 'listar_formas_pagamento_gc',
  });
  return resposta.formas_pagamento || [];
}

/** Muda a data de vencimento. O valor do título não é tocado. */
export async function alterarVencimento(recebimentoId: string, dataVencimento: string) {
  return chamar<{ data_vencimento_anterior: string; data_vencimento: string }>({
    action: 'atualizar_vencimento_recebimento',
    recebimento_id: recebimentoId,
    data_vencimento: dataVencimento,
  });
}

/** Dá baixa no título: marca como recebido na data e na forma informadas. */
export async function marcarComoRecebido(
  recebimentoId: string,
  dataLiquidacao: string,
  formaPagamentoId?: string
) {
  return chamar<{ situacao: string; data_liquidacao: string }>({
    action: 'atualizar_situacao_recebimento',
    recebimento_id: recebimentoId,
    situacao: 'recebido',
    data_liquidacao: dataLiquidacao,
    ...(formaPagamentoId ? { forma_pagamento_id: formaPagamentoId } : {}),
  });
}
